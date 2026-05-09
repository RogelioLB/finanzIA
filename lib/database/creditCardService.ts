import { useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";

export interface CreditInstallment {
  id: string;
  wallet_id: string;
  title: string;
  store: string | null;
  total_amount: number;
  monthly_amount: number;
  total_installments: number;
  paid_installments: number;
  start_date: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateInstallmentParams {
  wallet_id: string;
  title: string;
  store?: string;
  total_amount: number;
  monthly_amount: number;
  total_installments: number;
  start_date: number;
  notes?: string;
}

export interface PeriodInfo {
  periodStart: number;
  periodEnd: number;
  periodCharges: number;
}

function getPeriodBounds(cutOffDay: number): { start: number; end: number } {
  const today = new Date();
  const todayDay = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();

  let periodStart: Date;
  let periodEnd: Date;

  if (todayDay >= cutOffDay) {
    periodStart = new Date(year, month, cutOffDay);
    periodEnd = new Date(year, month + 1, cutOffDay);
  } else {
    periodStart = new Date(year, month - 1, cutOffDay);
    periodEnd = new Date(year, month, cutOffDay);
  }

  return { start: periodStart.getTime(), end: periodEnd.getTime() };
}

export function useCreditCardService() {
  const db = useSQLiteContext();

  return useMemo(() => {
    const getInstallments = async (walletId: string): Promise<CreditInstallment[]> => {
      return await db.getAllAsync<CreditInstallment>(
        "SELECT * FROM credit_installments WHERE wallet_id = ? ORDER BY created_at DESC",
        [walletId]
      );
    };

    const getAllInstallments = async (): Promise<CreditInstallment[]> => {
      return await db.getAllAsync<CreditInstallment>(
        "SELECT * FROM credit_installments ORDER BY created_at DESC"
      );
    };

    const createInstallment = async (params: CreateInstallmentParams): Promise<string> => {
      const id = uuid.v4() as string;
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO credit_installments (
          id, wallet_id, title, store, total_amount, monthly_amount,
          total_installments, paid_installments, start_date, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [
          id,
          params.wallet_id,
          params.title,
          params.store || null,
          params.total_amount,
          params.monthly_amount,
          params.total_installments,
          params.start_date,
          params.notes || null,
          now,
          now,
        ]
      );
      return id;
    };

    const deleteInstallment = async (id: string): Promise<void> => {
      await db.runAsync("DELETE FROM credit_installments WHERE id = ?", [id]);
    };

    const incrementPaidInstallments = async (id: string): Promise<void> => {
      await db.runAsync(
        `UPDATE credit_installments
         SET paid_installments = MIN(paid_installments + 1, total_installments),
             updated_at = ?
         WHERE id = ?`,
        [Date.now(), id]
      );
    };

    const calculatePeriodInfo = async (
      walletId: string,
      cutOffDay: number
    ): Promise<PeriodInfo> => {
      const { start, end } = getPeriodBounds(cutOffDay);

      const result = await db.getFirstAsync<{ expenses: number; income: number }>(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
        FROM transactions
        WHERE wallet_id = ? AND is_excluded = 0 AND timestamp >= ?`,
        [walletId, start]
      );

      return {
        periodStart: start,
        periodEnd: end,
        periodCharges: (result?.expenses ?? 0) - (result?.income ?? 0),
      };
    };

    return {
      getInstallments,
      getAllInstallments,
      createInstallment,
      deleteInstallment,
      incrementPaidInstallments,
      calculatePeriodInfo,
      getPeriodBounds,
    };
  }, [db]);
}
