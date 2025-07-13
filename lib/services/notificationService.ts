import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  calculateNextPaymentDate,
  getSubscriptionById,
  updateSubscription,
} from "../database/subscriptionService";
import { Subscription } from "../models/types";

// Map de notificaciones programadas (ID de suscripción -> ID de notificación)
const scheduledNotifications: Map<string, string> = new Map();

/**
 * Configura las notificaciones para la app
 */
export const setupNotifications = async () => {
  // Configurar el comportamiento de las notificaciones
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Solicitar permisos de notificaciones
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("subscription-reminders", {
      name: "Recordatorios de suscripciones",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C34E3", // Morado de la app
    });
  }

  // Verificar y solicitar permisos
  return await registerForPushNotifications();
};

/**
 * Registra la aplicación para recibir notificaciones push
 */
export const registerForPushNotifications = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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

/**
 * Programa una notificación para una suscripción
 */
export const scheduleSubscriptionNotification = async (
  subscription: Subscription
) => {
  // Si la suscripción no tiene permitidas las notificaciones, no programamos nada
  if (!subscription.allow_notifications) {
    await cancelSubscriptionNotification(subscription.id);
    return null;
  }

  // Cancelar cualquier notificación existente para esta suscripción
  await cancelSubscriptionNotification(subscription.id);

  // Calcular tiempo para la notificación (1 día antes del próximo pago)
  const notificationDate = new Date(subscription.next_payment_date);
  notificationDate.setDate(notificationDate.getDate() - 1); // Un día antes

  let trigger: Notifications.NotificationTriggerInput;
  switch (subscription.frequency) {
    case "monthly":
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: notificationDate.getDate(),
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    case "yearly":
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        day: notificationDate.getDate(),
        month: notificationDate.getMonth(),
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    case "daily":
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
      };
      break;
    case "weekly":
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour: notificationDate.getHours(),
        minute: notificationDate.getMinutes(),
        weekday: notificationDate.getDay(),
      };
      break;
    default:
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: notificationDate.getTime() / 1000,
        repeats: true,
      };
      break;
  }

  console.log(trigger);

  try {
    // Programar la notificación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${subscription.name}`,
        body: `Tu suscripción de ${subscription.amount.toFixed(2)} vence mañana`,
        data: { subscriptionId: subscription.id },
      },
      trigger,
    });

    // Guardar el ID de la notificación para poder cancelarla después
    scheduledNotifications.set(subscription.id, notificationId);
    console.log(
      `Notificación programada para ${subscription.name} (ID: ${notificationId})`
    );

    return notificationId;
  } catch (error) {
    console.error("Error al programar notificación:", error);
    return null;
  }
};

/**
 * Cancela una notificación programada para una suscripción
 */
export const cancelSubscriptionNotification = async (
  subscriptionId: string
) => {
  const notificationId = scheduledNotifications.get(subscriptionId);

  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      scheduledNotifications.delete(subscriptionId);
      console.log(`Notificación cancelada para suscripción ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error("Error al cancelar notificación:", error);
      return false;
    }
  }

  return false;
};

/**
 * Cancela todas las notificaciones programadas
 */
export const cancelAllSubscriptionNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    scheduledNotifications.clear();
    console.log("Todas las notificaciones canceladas");
    return true;
  } catch (error) {
    console.error("Error al cancelar todas las notificaciones:", error);
    return false;
  }
};

/**
 * Reprograma una notificación para el siguiente pago
 * Se llama automáticamente cuando se recibe una notificación o el usuario interactúa con ella
 */
export const rescheduleForNextPayment = async (
  subscriptionId: string
): Promise<boolean> => {
  try {
    // 1. Obtener la suscripción actual
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) {
      console.error(`No se encontró la suscripción con ID: ${subscriptionId}`);
      return false;
    }

    // 2. Comprobar si la notificación sigue habilitada
    if (!subscription.allow_notifications) {
      console.log(
        `Las notificaciones están desactivadas para la suscripción: ${subscription.name}`
      );
      return false;
    }

    // 3. Calcular la siguiente fecha de pago
    const nextPaymentDate = calculateNextPaymentDate(
      subscription.frequency,
      new Date(subscription.next_payment_date)
    );

    // 4. Actualizar la suscripción con la nueva fecha de pago
    const updatedSubscription = await updateSubscription(subscriptionId, {
      next_payment_date: nextPaymentDate,
    });

    // 5. Programar la nueva notificación
    const notificationId =
      await scheduleSubscriptionNotification(updatedSubscription);

    console.log(
      `Notificación reprogramada para ${new Date(nextPaymentDate).toLocaleDateString()} - Suscripción: ${subscription.name}`
    );

    return !!notificationId;
  } catch (error) {
    console.error("Error al reprogramar notificación:", error);
    return false;
  }
};
