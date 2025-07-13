import "react-native-get-random-values";
import uuid from "react-native-uuid";
import { Subscription, SubscriptionFrequency } from "../models/types";
import { openDatabase } from "./database";
import { scheduleSubscriptionNotification, cancelSubscriptionNotification } from "../services/notificationService";

/**
 * Obtiene todas las suscripciones activas
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = openDatabase();
      const result = await db.getAllAsync<Subscription>(
        `SELECT * FROM subscriptions WHERE is_deleted = 0 ORDER BY next_payment_date ASC`
      );
      resolve(result);
    } catch (error) {
      console.error("Error getting subscriptions:", error);
      reject(error);
    }
  });
};

/**
 * Obtiene una suscripción por su ID
 */
export const getSubscriptionById = async (
  id: string
): Promise<Subscription | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = openDatabase();
      const result = await db.getFirstAsync<Subscription>(
        `SELECT * FROM subscriptions WHERE id = ? AND is_deleted = 0`,
        [id]
      );
      resolve(result);
    } catch (error) {
      console.error("Error getting subscription by id:", error);
      reject(error);
    }
  });
};

/**
 * Crea una nueva suscripción
 */
export const createSubscription = async (
  subscription: Omit<
    Subscription,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_deleted"
    | "sync_status"
    | "last_synced_at"
  >
): Promise<Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = openDatabase();
      const now = Date.now();
      const id = uuid.v4();

      await db.runAsync(
        `INSERT INTO subscriptions (
          id, 
          name, 
          amount, 
          frequency, 
          next_payment_date, 
          account_id, 
          category_id, 
          description,
          allow_notifications,
          created_at, 
          updated_at, 
          is_deleted, 
          sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'local')`,
        [
          id,
          subscription.name,
          subscription.amount,
          subscription.frequency,
          subscription.next_payment_date,
          subscription.account_id,
          subscription.category_id || null,
          subscription.description || null,
          subscription.allow_notifications,
          now,
          now,
        ]
      );

      const newSubscription = await getSubscriptionById(id);
      if (!newSubscription) {
        throw new Error("Failed to create subscription");
      }

      // Programar notificación si están habilitadas
      if (newSubscription.allow_notifications) {
        await scheduleSubscriptionNotification(newSubscription);
      }

      resolve(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      reject(error);
    }
  });
};

/**
 * Actualiza una suscripción existente
 */
export const updateSubscription = async (
  id: string,
  subscription: Partial<
    Omit<
      Subscription,
      | "id"
      | "created_at"
      | "updated_at"
      | "is_deleted"
      | "sync_status"
      | "last_synced_at"
    >
  >
): Promise<Subscription> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = openDatabase();
      const existingSubscription = await getSubscriptionById(id);
      if (!existingSubscription) {
        throw new Error("Subscription not found");
      }

      const updateFields: string[] = [];
      const values: any[] = [];

      Object.entries(subscription).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        resolve(existingSubscription);
        return;
      }

      updateFields.push("updated_at = ?");
      values.push(Date.now());
      values.push(id);

      await db.runAsync(
        `UPDATE subscriptions SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      const updatedSubscription = await getSubscriptionById(id);
      if (!updatedSubscription) {
        throw new Error("Failed to update subscription");
      }

      // Manejar las notificaciones:
      // - Si las notificaciones están habilitadas, programarlas
      // - Si las notificaciones están deshabilitadas, cancelarlas
      // - Si se ha actualizado la fecha de pago o la frecuencia, reprogramar
      if (subscription.allow_notifications !== undefined || 
          subscription.next_payment_date !== undefined || 
          subscription.frequency !== undefined) {
        if (updatedSubscription.allow_notifications) {
          await scheduleSubscriptionNotification(updatedSubscription);
        } else {
          await cancelSubscriptionNotification(updatedSubscription.id);
        }
      }

      resolve(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      reject(error);
    }
  });
};

/**
 * Elimina una suscripción (marcándola como eliminada)
 */
export const deleteSubscription = async (id: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Cancelar la notificación asociada a esta suscripción
      await cancelSubscriptionNotification(id);
      
      const db = openDatabase();
      await db.runAsync(
        `UPDATE subscriptions SET is_deleted = 1, updated_at = ? WHERE id = ?`,
        [Date.now(), id]
      );
      resolve();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      reject(error);
    }
  });
};

/**
 * Calcula la próxima fecha de pago en base a la frecuencia
 */
export const calculateNextPaymentDate = (
  frequency: SubscriptionFrequency,
  fromDate: Date = new Date()
): number => {
  const date = new Date(fromDate);

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.getTime();
};

/**
 * Obtiene las suscripciones próximas a vencer (en los próximos días especificados)
 */
export const getUpcomingSubscriptions = async (
  daysAhead: number = 7
): Promise<Subscription[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = openDatabase();
      const now = Date.now();
      const endDate = now + daysAhead * 24 * 60 * 60 * 1000; // Convierte días a milisegundos

      const result = await db.getAllAsync<Subscription>(
        `SELECT * FROM subscriptions 
         WHERE is_deleted = 0 
         AND next_payment_date BETWEEN ? AND ? 
         ORDER BY next_payment_date ASC`,
        [now, endDate]
      );

      resolve(result);
    } catch (error) {
      console.error("Error getting upcoming subscriptions:", error);
      reject(error);
    }
  });
};
