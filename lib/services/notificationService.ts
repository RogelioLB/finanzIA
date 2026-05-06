import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_QUEUE_KEY = 'finanzia.notification.queue';

export interface QueuedNotification {
  subscriptionId: string;
  notificationId: string;
  nextPaymentDate: number;
}

function clampDay(day: number): number {
  return Math.min(day, 28);
}

export const setupNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("subscription-reminders", {
      name: "Recordatorios de suscripciones",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C34E3",
    });
    await Notifications.setNotificationChannelAsync("budget-alerts", {
      name: "Alertas de presupuesto",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B35",
    });
    await Notifications.setNotificationChannelAsync("investment-summary", {
      name: "Resumen de inversiones",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#34C759",
    });
    await Notifications.setNotificationChannelAsync("general", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7952FC",
    });
  }

  return await registerForPushNotifications();
};

export const registerForPushNotifications = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("No se han concedido permisos de notificaciones");
      return false;
    }

    return true;
  } else {
    console.log("Las notificaciones push requieren un dispositivo físico");
    return false;
  }
};

export const scheduleSubscriptionNotification = async (subscription: any) => {
  if (!subscription.allow_notifications) {
    await cancelSubscriptionNotification(subscription.id);
    return null;
  }

  await cancelSubscriptionNotification(subscription.id);

  const notificationDate = new Date(subscription.next_payment_date);
  notificationDate.setDate(notificationDate.getDate() - 1);
  notificationDate.setHours(9, 0, 0, 0);

  let trigger: Notifications.NotificationTriggerInput;

  switch (subscription.frequency) {
    case "monthly": {
      const day = clampDay(notificationDate.getDate());
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day,
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    }
    case "yearly": {
      const day = clampDay(notificationDate.getDate());
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        day,
        month: notificationDate.getMonth() + 1,
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    }
    case "daily":
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    case "weekly": {
      const jsWeekday = notificationDate.getDay();
      const expoWeekday = jsWeekday === 0 ? 7 : jsWeekday;
      const hour = notificationDate.getHours();
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour: hour === 0 ? 9 : hour,
        minute: notificationDate.getMinutes(),
        weekday: Math.max(1, Math.min(7, expoWeekday)),
      };
      break;
    }
    default: {
      trigger = null;
      break;
    }
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${subscription.name}`,
        body: `Tu suscripción de ${subscription.amount.toFixed(2)} MXN vence mañana`,
        data: { subscriptionId: subscription.id, type: 'subscription-reminder' },
      },
      trigger,
    });

    await addToNotificationQueue(subscription.id, notificationId, subscription.next_payment_date);
    console.log(`Notificación programada para ${subscription.name} (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error("Error al programar notificación:", error);
    return null;
  }
};

export const cancelSubscriptionNotification = async (subscriptionId: string) => {
  try {
    const queue = await getNotificationQueue();
    const entry = queue.find(q => q.subscriptionId === subscriptionId);

    if (entry) {
      await Notifications.cancelScheduledNotificationAsync(entry.notificationId);
      await removeFromNotificationQueue(subscriptionId);
    }
    return true;
  } catch (error) {
    console.error("Error al cancelar notificación:", error);
    return false;
  }
};

export const cancelAllSubscriptionNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await clearNotificationQueue();
    console.log("Todas las notificaciones canceladas");
    return true;
  } catch (error) {
    console.error("Error al cancelar todas las notificaciones:", error);
    return false;
  }
};

export const rescheduleForNextPayment = async (subscriptionId: string): Promise<boolean> => {
  console.log(`[rescheduleForNextPayment] DEPRECATED - Subscription processor handles this for ${subscriptionId}`);
  return true;
};

export const sendTestNotification = async (
  title: string = "Notificación de Prueba",
  body: string = "Esta es una notificación de prueba del sistema de suscripciones"
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: "test-notification" },
      },
      trigger: null,
    });
    console.log(`Notificación de prueba enviada (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error("Error enviando notificación de prueba:", error);
    return null;
  }
};

export const scheduleTestNotificationWithDelay = async (
  delaySeconds: number,
  title: string = "Recordatorio de Prueba",
  body: string = "Esta notificación se programó para probar el sistema"
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: "test-notification-delayed" } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
        repeats: false,
      },
    });
    console.log(`Notificación de prueba programada para ${delaySeconds} segundos (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error("Error programando notificación de prueba:", error);
    return null;
  }
};

export const simulateSubscriptionNotification = async (
  subscriptionName: string,
  amount: number
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${subscriptionName}`,
        body: `Tu suscripción de $${amount.toFixed(2)} MXN vence mañana`,
        data: { type: "subscription-reminder-test", subscriptionName, amount },
      },
      trigger: null,
    });
    console.log(`Notificación de suscripción simulada enviada (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error("Error simulando notificación de suscripción:", error);
    return null;
  }
};

export const listScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Notificaciones programadas: ${scheduled.length}`);
    scheduled.forEach((n, i) => {
      console.log(`  ${i + 1}. ${n.content.title} (ID: ${n.identifier})`);
    });
    return scheduled;
  } catch (error) {
    console.error("Error listando notificaciones programadas:", error);
    return [];
  }
};

export const sendImmediateNotification = async (params: {
  title: string;
  body: string;
  data?: any;
  channel?: 'subscription-reminders' | 'budget-alerts' | 'investment-summary' | 'general';
}) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: { ...params.data, type: params.channel ?? 'general' },
      },
      trigger: null,
    });
    return notificationId;
  } catch (error) {
    console.error("[sendImmediateNotification] Error:", error);
    return null;
  }
};

async function getNotificationQueue(): Promise<QueuedNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveNotificationQueue(queue: QueuedNotification[]): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
}

async function addToNotificationQueue(subscriptionId: string, notificationId: string, nextPaymentDate: number): Promise<void> {
  const queue = await getNotificationQueue();
  const filtered = queue.filter(q => q.subscriptionId !== subscriptionId);
  filtered.push({ subscriptionId, notificationId, nextPaymentDate });
  await saveNotificationQueue(filtered);
}

async function removeFromNotificationQueue(subscriptionId: string): Promise<void> {
  const queue = await getNotificationQueue();
  const filtered = queue.filter(q => q.subscriptionId !== subscriptionId);
  await saveNotificationQueue(filtered);
}

async function clearNotificationQueue(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATION_QUEUE_KEY);
}

export { getNotificationQueue, addToNotificationQueue, removeFromNotificationQueue, clearNotificationQueue };

export const isNotificationScheduled = async (subscriptionId: string): Promise<boolean> => {
  const queue = await getNotificationQueue();
  const entry = queue.find(q => q.subscriptionId === subscriptionId);
  if (!entry) return false;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some(s => s.identifier === entry.notificationId);
};

export const syncNotificationQueue = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const queue = await getNotificationQueue();

  const scheduledIds = new Set(scheduled.map(s => s.identifier));
  const cleaned = queue.filter(q => scheduledIds.has(q.notificationId));
  await saveNotificationQueue(cleaned);
};

export const needsReschedule = async (subscriptionId: string, nextPaymentDate: number): Promise<boolean> => {
  const startOfTomorrow = new Date();
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);
  if (nextPaymentDate < startOfTomorrow.getTime()) return false;

  const queue = await getNotificationQueue();
  const entry = queue.find(q => q.subscriptionId === subscriptionId);

  if (!entry) return true;
  if (entry.nextPaymentDate !== nextPaymentDate) return true;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const stillExists = scheduled.some(s => s.identifier === entry.notificationId);

  return !stillExists;
};