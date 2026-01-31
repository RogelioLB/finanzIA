import { SQLiteDatabase } from "expo-sqlite";
import uuid from "react-native-uuid";
import { Subscription, SubscriptionFrequency } from "../models/types";
import { Transaction } from "./sqliteService";

/**
 * Servicio para manejar operaciones de suscripciones
 * Las suscripciones se almacenan como transacciones con is_subscription = 1
 */

/**
 * Calcula la próxima fecha de pago basándose en la frecuencia
 */
export const calculateNextPaymentDate = (
  frequency: SubscriptionFrequency,
  currentDate: Date
): number => {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      // Agregar un mes, manejando correctamente los casos de fin de mes
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate.getTime();
};

/**
 * Convierte una transacción a formato Subscription
 */
const transactionToSubscription = (transaction: Transaction): Subscription => {
  return {
    id: transaction.id,
    created_at: transaction.created_at || Date.now(),
    updated_at: transaction.updated_at || Date.now(),
    is_deleted: 0,
    sync_status: "local",
    name: transaction.title || "",
    amount: transaction.amount,
    frequency: (transaction.subscription_frequency ||
      "monthly") as SubscriptionFrequency,
    type: (transaction.type || "expense") as "income" | "expense" | "transfer",
    next_payment_date: transaction.next_payment_date || Date.now(),
    account_id: transaction.wallet_id,
    category_id: transaction.category_id,
    description: transaction.note,
    allow_notifications: 1, // Por defecto permitir notificaciones
  };
};

/**
 * Obtiene una suscripción por ID
 * Convierte la transacción a formato Subscription
 */
export const getSubscriptionById = async (
  db: SQLiteDatabase,
  id: string
): Promise<Subscription | null> => {
  const transaction = await db.getFirstAsync<Transaction>(
    `SELECT t.*,
       c.name as category_name, c.icon as category_icon, c.color as category_color,
       w.name as wallet_name, w.icon as wallet_icon, w.color as wallet_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE t.id = ? AND t.is_subscription = 1`,
    [id]
  );

  if (!transaction) {
    return null;
  }

  return transactionToSubscription(transaction);
};

/**
 * Obtiene todas las suscripciones activas
 */
export const getAllSubscriptions = async (
  db: SQLiteDatabase
): Promise<Subscription[]> => {
  const transactions = await db.getAllAsync<Transaction>(
    `SELECT t.*,
       c.name as category_name, c.icon as category_icon, c.color as category_color,
       w.name as wallet_name, w.icon as wallet_icon, w.color as wallet_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE t.is_subscription = 1
     ORDER BY t.next_payment_date ASC`
  );

  return transactions.map(transactionToSubscription);
};

/**
 * Actualiza una suscripción
 */
export const updateSubscription = async (
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Subscription>
): Promise<Subscription> => {
  const now = Date.now();

  // Construir la query de actualización
  const fieldsToUpdate: string[] = [];
  const values: any[] = [];

  if (updates.next_payment_date !== undefined) {
    fieldsToUpdate.push("next_payment_date = ?");
    values.push(updates.next_payment_date);
  }
  if (updates.name !== undefined) {
    fieldsToUpdate.push("title = ?");
    values.push(updates.name);
  }
  if (updates.amount !== undefined) {
    fieldsToUpdate.push("amount = ?");
    values.push(updates.amount);
  }
  if (updates.type !== undefined) {
    fieldsToUpdate.push("type = ?");
    values.push(updates.type);
  }
  if (updates.frequency !== undefined) {
    fieldsToUpdate.push("subscription_frequency = ?");
    values.push(updates.frequency);
  }
  if (updates.account_id !== undefined) {
    fieldsToUpdate.push("wallet_id = ?");
    values.push(updates.account_id);
  }
  if (updates.description !== undefined) {
    fieldsToUpdate.push("note = ?");
    values.push(updates.description);
  }

  fieldsToUpdate.push("updated_at = ?");
  values.push(now);

  // Agregar el ID al final para el WHERE
  values.push(id);

  if (fieldsToUpdate.length > 0) {
    await db.runAsync(
      `UPDATE transactions SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
      values
    );
  }

  // Obtener la suscripción actualizada
  const updatedSubscription = await getSubscriptionById(db, id);
  if (!updatedSubscription) {
    throw new Error(`Subscription with id ${id} not found after update`);
  }

  return updatedSubscription;
};

/**
 * Crea una transacción para una suscripción
 */
export const createSubscriptionTransaction = async (
  db: SQLiteDatabase,
  subscription: Subscription
): Promise<string> => {
  const now = Date.now();
  const transactionId = uuid.v4() as string;

  await db.runAsync(
    `INSERT INTO transactions (
      id, wallet_id, amount, type, title, note, timestamp,
      category_id, is_subscription, is_excluded, created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transactionId,
      subscription.account_id,
      subscription.amount,
      subscription.type, // Usar el tipo original de la suscripción (gasto o ingreso)
      subscription.name,
      subscription.description ||
        `Pago automático de suscripción: ${subscription.name}`,
      now,
      subscription.category_id || null,
      0, // No es una definición de suscripción, es una transacción normal
      0, // Incluida en el balance
      now,
      now,
      "local",
    ]
  );

  return transactionId;
};

/**
 * Obtiene suscripciones que deben procesarse hoy
 */
export const getSubscriptionsDueToday = async (
  db: SQLiteDatabase
): Promise<Subscription[]> => {
  const allSubscriptions = await getAllSubscriptions(db);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return allSubscriptions.filter((sub) => {
    const nextPayment = sub.next_payment_date;
    return (
      nextPayment >= todayStart.getTime() && nextPayment <= todayEnd.getTime()
    );
  });
};

/**
 * Obtiene suscripciones que vencen mañana (para notificaciones de recordatorio)
 */
export const getSubscriptionsDueTomorrow = async (
  db: SQLiteDatabase
): Promise<Subscription[]> => {
  const allSubscriptions = await getAllSubscriptions(db);
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(23, 59, 59, 999);

  return allSubscriptions.filter((sub) => {
    const nextPayment = sub.next_payment_date;
    return (
      nextPayment >= tomorrowStart.getTime() &&
      nextPayment <= tomorrowEnd.getTime()
    );
  });
};
