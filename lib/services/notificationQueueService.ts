import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const NOTIFICATION_QUEUE_KEY = "@notification_queue";
const SCHEDULED_NOTIFICATIONS_KEY = "@scheduled_notifications";

interface ScheduledNotificationRecord {
  subscriptionId: string;
  notificationId: string;
  nextPaymentDate: number;
  scheduledAt: number;
}

interface NotificationQueue {
  scheduledNotifications: ScheduledNotificationRecord[];
  lastUpdated: number;
}

/**
 * Obtiene la cola de notificaciones desde el almacenamiento persistente
 */
export const getNotificationQueue = async (): Promise<NotificationQueue> => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_QUEUE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error al obtener cola de notificaciones:", error);
  }
  return { scheduledNotifications: [], lastUpdated: 0 };
};

/**
 * Guarda la cola de notificaciones en el almacenamiento persistente
 */
export const saveNotificationQueue = async (
  queue: NotificationQueue
): Promise<void> => {
  try {
    queue.lastUpdated = Date.now();
    await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error al guardar cola de notificaciones:", error);
  }
};

/**
 * Verifica si una notificación ya está programada para una suscripción
 */
export const isNotificationScheduled = async (
  subscriptionId: string,
  nextPaymentDate: number
): Promise<boolean> => {
  const queue = await getNotificationQueue();
  return queue.scheduledNotifications.some(
    (n) =>
      n.subscriptionId === subscriptionId &&
      n.nextPaymentDate === nextPaymentDate
  );
};

/**
 * Agrega una notificación a la cola
 */
export const addToNotificationQueue = async (
  subscriptionId: string,
  notificationId: string,
  nextPaymentDate: number
): Promise<void> => {
  const queue = await getNotificationQueue();

  // Remover notificación anterior para esta suscripción si existe
  queue.scheduledNotifications = queue.scheduledNotifications.filter(
    (n) => n.subscriptionId !== subscriptionId
  );

  // Agregar la nueva notificación
  queue.scheduledNotifications.push({
    subscriptionId,
    notificationId,
    nextPaymentDate,
    scheduledAt: Date.now(),
  });

  await saveNotificationQueue(queue);
};

/**
 * Remueve una notificación de la cola
 */
export const removeFromNotificationQueue = async (
  subscriptionId: string
): Promise<void> => {
  const queue = await getNotificationQueue();
  queue.scheduledNotifications = queue.scheduledNotifications.filter(
    (n) => n.subscriptionId !== subscriptionId
  );
  await saveNotificationQueue(queue);
};

/**
 * Limpia toda la cola de notificaciones
 */
export const clearNotificationQueue = async (): Promise<void> => {
  await saveNotificationQueue({ scheduledNotifications: [], lastUpdated: Date.now() });
};

/**
 * Sincroniza la cola con las notificaciones realmente programadas en el sistema
 * Elimina de la cola las notificaciones que ya no existen
 */
export const syncNotificationQueue = async (): Promise<void> => {
  try {
    const queue = await getNotificationQueue();
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduledNotifications.map((n) => n.identifier));

    // Filtrar notificaciones que ya no están programadas
    const validNotifications = queue.scheduledNotifications.filter((n) =>
      scheduledIds.has(n.notificationId)
    );

    if (validNotifications.length !== queue.scheduledNotifications.length) {
      console.log(
        `Sincronizando cola: ${queue.scheduledNotifications.length} -> ${validNotifications.length} notificaciones`
      );
      queue.scheduledNotifications = validNotifications;
      await saveNotificationQueue(queue);
    }
  } catch (error) {
    console.error("Error al sincronizar cola de notificaciones:", error);
  }
};

/**
 * Obtiene el ID de notificación para una suscripción específica
 */
export const getNotificationIdForSubscription = async (
  subscriptionId: string
): Promise<string | null> => {
  const queue = await getNotificationQueue();
  const record = queue.scheduledNotifications.find(
    (n) => n.subscriptionId === subscriptionId
  );
  return record?.notificationId || null;
};

/**
 * Verifica si necesita reprogramar notificaciones (comparando fechas)
 */
export const needsReschedule = async (
  subscriptionId: string,
  newNextPaymentDate: number
): Promise<boolean> => {
  const queue = await getNotificationQueue();
  const existing = queue.scheduledNotifications.find(
    (n) => n.subscriptionId === subscriptionId
  );

  if (!existing) return true;
  return existing.nextPaymentDate !== newNextPaymentDate;
};
