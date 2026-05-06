import { SQLiteDatabase } from "expo-sqlite";
import {
  calculateNextPaymentDate,
  createSubscriptionTransaction,
  getSubscriptionsDueToday,
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
  _db: SQLiteDatabase
): Promise<number> => {
  // Los recordatorios se manejan vía scheduled notifications en foreground (NotificationsContext).
  // No se envían notificaciones inmediatas desde background.
  return 0;
};

/**
 * Función principal que ejecuta todas las tareas de procesamiento de suscripciones
 * Esta función debe ejecutarse diariamente
 */
export const executeSubscriptionTasks = async (
  db: SQLiteDatabase
): Promise<void> => {
  console.log("=== Iniciando procesamiento de suscripciones ===");

  const { processed, errors } = await processSubscriptionsDueToday(db);

  console.log("=== Procesamiento completado ===");
  console.log(`Transacciones creadas: ${processed}`);
  console.log(`Errores: ${errors}`);
};
