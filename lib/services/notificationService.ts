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
      // getDay() retorna 0-6 (0=domingo), pero Expo Notifications espera 1-7 (1=domingo)
      // Fórmula: (getDay() + 1) convierte 0-6 a 1-7
      const jsWeekday = notificationDate.getDay(); // 0-6
      const expoWeekday = jsWeekday + 1; // 1-7
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        hour: notificationDate.getHours() || 9, // Fallback a las 9am si no hay hora
        minute: notificationDate.getMinutes() || 0,
        weekday: Math.max(1, Math.min(7, expoWeekday)), // Asegurar rango 1-7
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
 * NOTA: Esta función está deprecada ya que ahora el procesamiento automático
 * maneja la actualización de fechas. Se mantiene por compatibilidad.
 */
export const rescheduleForNextPayment = async (
  subscriptionId: string
): Promise<boolean> => {
  console.log(
    `[rescheduleForNextPayment] Función deprecada llamada para ${subscriptionId}`
  );
  console.log(
    "La actualización de fechas ahora se maneja automáticamente por el procesador de suscripciones"
  );
  return true;
};

// ==================== FUNCIONES DE TESTING ====================

/**
 * Envía una notificación de prueba inmediatamente
 * Útil para verificar que el sistema de notificaciones funciona correctamente
 */
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
      trigger: null, // Enviar inmediatamente
    });
    console.log(`Notificación de prueba enviada (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error("Error enviando notificación de prueba:", error);
    return null;
  }
};

/**
 * Programa una notificación de prueba con un delay específico (en segundos)
 * Útil para probar notificaciones programadas sin esperar días
 */
export const scheduleTestNotificationWithDelay = async (
  delaySeconds: number,
  title: string = "Recordatorio de Prueba",
  body: string = "Esta notificación se programó para probar el sistema"
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: "test-notification-delayed" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
        repeats: false,
      },
    });
    console.log(
      `Notificación de prueba programada para ${delaySeconds} segundos (ID: ${notificationId})`
    );
    return notificationId;
  } catch (error) {
    console.error("Error programando notificación de prueba:", error);
    return null;
  }
};

/**
 * Simula una notificación de suscripción
 * Permite probar el flujo completo sin modificar datos reales
 */
export const simulateSubscriptionNotification = async (
  subscriptionName: string,
  amount: number
): Promise<string | null> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Recordatorio: ${subscriptionName}`,
        body: `Tu suscripción de $${amount.toFixed(2)} vence mañana`,
        data: {
          type: "subscription-reminder-test",
          subscriptionName,
          amount,
        },
      },
      trigger: null, // Enviar inmediatamente
    });
    console.log(
      `Notificación de suscripción simulada enviada (ID: ${notificationId})`
    );
    return notificationId;
  } catch (error) {
    console.error("Error simulando notificación de suscripción:", error);
    return null;
  }
};

/**
 * Lista todas las notificaciones programadas
 * Útil para depuración
 */
export const listScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
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
