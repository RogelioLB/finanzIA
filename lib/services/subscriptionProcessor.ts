import { SQLiteDatabase } from "expo-sqlite";
import * as Notifications from "expo-notifications";
import {
  calculateNextPaymentDate,
  createSubscriptionTransaction,
  getSubscriptionsDueToday,
  getSubscriptionsDueTomorrow,
  updateSubscription,
} from "../database/subscriptionService";

/**
 * Servicio para procesar automáticamente las suscripciones
 * Crea transacciones cuando llega la fecha de pago
 */

/**
 * Procesa todas las suscripciones que vencen hoy
 * Crea la transacción correspondiente y actualiza la siguiente fecha
 */
export const processSubscriptionsDueToday = async (
  db: SQLiteDatabase
): Promise<{
  processed: number;
  errors: number;
}> => {
  try {
    const subscriptionsDue = await getSubscriptionsDueToday(db);
    console.log(
      `Procesando ${subscriptionsDue.length} suscripciones que vencen hoy`
    );

    let processed = 0;
    let errors = 0;

    for (const subscription of subscriptionsDue) {
      try {
        // 1. Crear la transacción
        await createSubscriptionTransaction(db, subscription);

        // 2. Calcular la siguiente fecha de pago
        const nextPaymentDate = calculateNextPaymentDate(
          subscription.frequency,
          new Date(subscription.next_payment_date)
        );

        // 3. Actualizar la suscripción con la nueva fecha
        await updateSubscription(db, subscription.id, {
          next_payment_date: nextPaymentDate,
        });

        // 4. Enviar notificación de confirmación
        await sendTransactionCreatedNotification(
          subscription.name,
          subscription.amount
        );

        processed++;
        console.log(`✓ Procesada suscripción: ${subscription.name}`);
      } catch (error) {
        errors++;
        console.error(
          `✗ Error procesando suscripción ${subscription.name}:`,
          error
        );
      }
    }

    console.log(
      `Procesamiento completado: ${processed} exitosas, ${errors} errores`
    );
    return { processed, errors };
  } catch (error) {
    console.error("Error en processSubscriptionsDueToday:", error);
    return { processed: 0, errors: 1 };
  }
};

/**
 * Envía notificaciones de recordatorio para suscripciones que vencen mañana
 */
export const sendReminderNotifications = async (
  db: SQLiteDatabase
): Promise<number> => {
  try {
    const subscriptionsDueTomorrow = await getSubscriptionsDueTomorrow(db);
    console.log(
      `Enviando ${subscriptionsDueTomorrow.length} notificaciones de recordatorio`
    );

    let sent = 0;

    for (const subscription of subscriptionsDueTomorrow) {
      try {
        if (subscription.allow_notifications) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Recordatorio: ${subscription.name}`,
              body: `Tu suscripción de $${subscription.amount.toFixed(2)} vence mañana`,
              data: {
                type: "subscription-reminder",
                subscriptionId: subscription.id,
              },
            },
            trigger: null, // Enviar inmediatamente
          });
          sent++;
        }
      } catch (error) {
        console.error(
          `Error enviando notificación para ${subscription.name}:`,
          error
        );
      }
    }

    console.log(`${sent} notificaciones de recordatorio enviadas`);
    return sent;
  } catch (error) {
    console.error("Error en sendReminderNotifications:", error);
    return 0;
  }
};

/**
 * Envía una notificación cuando se crea automáticamente una transacción
 */
export const sendTransactionCreatedNotification = async (
  subscriptionName: string,
  amount: number
): Promise<boolean> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Transacción acreditada",
        body: `Se ha registrado el pago de ${subscriptionName} por $${amount.toFixed(2)}`,
        data: {
          type: "subscription-transaction-created",
          subscriptionName,
          amount,
        },
      },
      trigger: null, // Enviar inmediatamente
    });
    return true;
  } catch (error) {
    console.error("Error enviando notificación de transacción creada:", error);
    return false;
  }
};

/**
 * Función principal que ejecuta todas las tareas de procesamiento de suscripciones
 * Esta función debe ejecutarse diariamente
 */
export const executeSubscriptionTasks = async (
  db: SQLiteDatabase
): Promise<void> => {
  console.log("=== Iniciando procesamiento de suscripciones ===");

  // 1. Procesar suscripciones que vencen hoy
  const { processed, errors } = await processSubscriptionsDueToday(db);

  // 2. Enviar recordatorios para suscripciones que vencen mañana
  const reminders = await sendReminderNotifications(db);

  console.log("=== Procesamiento completado ===");
  console.log(`Transacciones creadas: ${processed}`);
  console.log(`Errores: ${errors}`);
  console.log(`Recordatorios enviados: ${reminders}`);
};
