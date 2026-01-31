/**
 * Tipos para la base de datos
 */

// Estado de sincronización con la nube
export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict';

// Tipos base para todos los modelos
export interface BaseModel {
  id: string;
  created_at: number;
  updated_at: number;
  is_deleted: number;
  sync_status: SyncStatus;
  last_synced_at?: number;
}

// Cuenta bancaria
export interface Account extends BaseModel {
  name: string;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
}

// Tipo de transacción
export type TransactionType = 'income' | 'expense' | 'transfer';

// Categoría de transacción
export interface Category extends BaseModel {
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

// Transacción financiera
export interface Transaction extends BaseModel {
  account_id: string;
  category_id?: string;
  amount: number;
  description?: string;
  date: number;
  type: TransactionType;
  to_account_id?: string; // Solo para transferencias
}

// Tipo de frecuencia de suscripción
export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Suscripción
export interface Subscription extends BaseModel {
  name: string;
  amount: number;
  type: TransactionType;
  frequency: SubscriptionFrequency;
  next_payment_date: number;
  account_id: string;
  category_id?: string;
  description?: string;
  allow_notifications: number; // 1 para permitir, 0 para no permitir
}

// Tipo para las estadísticas
export interface TransactionSummary {
  categoryName: string;
  categoryId: string;
  categoryIcon?: string;
  categoryColor?: string;
  total: number;
  percentage: number;
}

// Tipos de respuesta para las operaciones de la base de datos
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
