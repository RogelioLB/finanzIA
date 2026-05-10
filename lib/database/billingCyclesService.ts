import { useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";

export interface BillingCycle {
  id: string;
  wallet_id: string;
  cycle_number: number;
  start_date: number;
  end_date: number;
  opening_balance: number;
  closing_balance: number | null;
  minimum_payment: number;
  interest_rate: number;
  interest_applied: number;
  status: "active" | "closed" | "future";
  notes: string | null;
  created_at: number;
  updated_at: number;
  // Calculated
  period_charges?: number;
  current_balance?: number;
}

export interface CreateBillingCycleParams {
  wallet_id: string;
  cycle_number: number;
  start_date: number;
  end_date: number;
  opening_balance: number;
  minimum_payment?: number;
  interest_rate?: number;
  notes?: string;
  status?: "active" | "closed" | "future";
}

export interface BulkCreateCycleInput {
  opening_balance: number;
  minimum_payment: number;
  notes?: string;
}

/** Returns start of day in ms for a given Date. */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Adds N months to a date, keeping the same day clamped to month end. */
function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function useBillingCyclesService() {
  const db = useSQLiteContext();

  return useMemo(() => {
    /** Get all cycles for a wallet ordered by cycle_number. */
    const getCycles = async (walletId: string): Promise<BillingCycle[]> => {
      const rows = await db.getAllAsync<BillingCycle>(
        `SELECT * FROM billing_cycles WHERE wallet_id = ? ORDER BY cycle_number ASC`,
        [walletId]
      );

      // Calculate period_charges and current_balance for each cycle
      const now = Date.now();
      return Promise.all(
        rows.map(async (cycle: BillingCycle) => {
          const charges = await db.getFirstAsync<{ expenses: number; income: number }>(
            `SELECT
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
            FROM transactions
            WHERE wallet_id = ? AND is_excluded = 0
              AND timestamp >= ? AND timestamp < ?`,
            [walletId, cycle.start_date, cycle.end_date]
          );
          const periodCharges = (charges?.expenses ?? 0) - (charges?.income ?? 0);
          return {
            ...cycle,
            period_charges: periodCharges,
            current_balance: cycle.opening_balance + periodCharges,
          };
        })
      );
    };

    /** Get the currently active cycle (status='active'). */
    const getActiveCycle = async (walletId: string): Promise<BillingCycle | null> => {
      const cycle = await db.getFirstAsync<BillingCycle>(
        `SELECT * FROM billing_cycles WHERE wallet_id = ? AND status = 'active' LIMIT 1`,
        [walletId]
      );
      return cycle ?? null;
    };

    /** Create a single billing cycle. */
    const createCycle = async (params: CreateBillingCycleParams): Promise<string> => {
      const id = uuid.v4() as string;
      const now = Date.now();
      const status = params.status ?? "future";
      await db.runAsync(
        `INSERT INTO billing_cycles (
          id, wallet_id, cycle_number, start_date, end_date,
          opening_balance, closing_balance, minimum_payment, interest_rate,
          interest_applied, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 0, ?, ?, ?, ?)`,
        [
          id,
          params.wallet_id,
          params.cycle_number,
          params.start_date,
          params.end_date,
          params.opening_balance,
          params.minimum_payment ?? 0,
          params.interest_rate ?? 0,
          status,
          params.notes ?? null,
          now,
          now,
        ]
      );
      return id;
    };

    /**
     * Bulk-create N billing cycles during wallet creation.
     * The first cycle that covers today becomes 'active'; past ones 'closed'; future ones 'future'.
     * Each cycle's opening_balance = previous cycle opening_balance - minimum_payment (user-defined).
     */
    const bulkCreateCycles = async (
      walletId: string,
      startDate: Date,
      durationMonths: number,
      count: number,
      interestRate: number,
      cycles: BulkCreateCycleInput[]
    ): Promise<string[]> => {
      const now = Date.now();
      const ids: string[] = [];

      for (let i = 0; i < count; i++) {
        const cycleStart = addMonths(startDate, i * durationMonths);
        const cycleEnd = addMonths(startDate, (i + 1) * durationMonths);
        const startMs = startOfDay(cycleStart);
        const endMs = startOfDay(cycleEnd);

        let status: "active" | "closed" | "future";
        if (now >= startMs && now < endMs) {
          status = "active";
        } else if (now >= endMs) {
          status = "closed";
        } else {
          status = "future";
        }

        const input = cycles[i];
        const id = await createCycle({
          wallet_id: walletId,
          cycle_number: i + 1,
          start_date: startMs,
          end_date: endMs,
          opening_balance: input.opening_balance,
          minimum_payment: input.minimum_payment,
          interest_rate: interestRate,
          notes: input.notes,
          status,
        });
        ids.push(id);
      }
      return ids;
    };

    /**
     * Close a billing cycle: set its closing_balance and status='closed'.
     * If auto_generate=true and no next cycle exists, creates the next one with
     * closing_balance + (closing_balance * monthly_interest_rate) as opening balance.
     */
    const closeCycle = async (
      cycleId: string,
      closingBalance: number,
      autoGenerate = true
    ): Promise<void> => {
      const now = Date.now();
      const cycle = await db.getFirstAsync<BillingCycle>(
        `SELECT * FROM billing_cycles WHERE id = ?`,
        [cycleId]
      );
      if (!cycle) return;

      const interestApplied = closingBalance * (cycle.interest_rate / 100);

      await db.runAsync(
        `UPDATE billing_cycles
         SET closing_balance = ?, interest_applied = ?, status = 'closed', updated_at = ?
         WHERE id = ?`,
        [closingBalance, interestApplied, now, cycleId]
      );

      if (!autoGenerate) return;

      // Check if a next cycle already exists
      const next = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM billing_cycles WHERE wallet_id = ? AND cycle_number = ?`,
        [cycle.wallet_id, cycle.cycle_number + 1]
      );
      if (next) {
        // Activate the existing next cycle
        await db.runAsync(
          `UPDATE billing_cycles SET status = 'active', updated_at = ? WHERE id = ?`,
          [now, next.id]
        );
        return;
      }

      // Auto-generate next cycle
      const prevEnd = new Date(cycle.end_date);
      const nextEnd = addMonths(prevEnd, 1);
      const newOpeningBalance = closingBalance + interestApplied;

      await createCycle({
        wallet_id: cycle.wallet_id,
        cycle_number: cycle.cycle_number + 1,
        start_date: cycle.end_date,
        end_date: startOfDay(nextEnd),
        opening_balance: newOpeningBalance,
        minimum_payment: cycle.minimum_payment,
        interest_rate: cycle.interest_rate,
        notes: "Generado automáticamente al cerrar ciclo anterior",
        status: "active",
      });
    };

    /** Check and auto-close any expired active cycles. Call periodically (e.g., on app launch). */
    const autoCloseExpiredCycles = async (): Promise<void> => {
      const now = Date.now();
      const expired = await db.getAllAsync<BillingCycle>(
        `SELECT * FROM billing_cycles WHERE status = 'active' AND end_date <= ?`,
        [now]
      );
      for (const cycle of expired) {
        // Calculate actual closing balance from transactions
        const result = await db.getFirstAsync<{ expenses: number; income: number }>(
          `SELECT
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
          FROM transactions
          WHERE wallet_id = ? AND is_excluded = 0
            AND timestamp >= ? AND timestamp < ?`,
          [cycle.wallet_id, cycle.start_date, cycle.end_date]
        );
        const periodCharges = (result?.expenses ?? 0) - (result?.income ?? 0);
        const closing = cycle.opening_balance + periodCharges;
        await closeCycle(cycle.id, closing, true);
      }
    };

    const updateCycle = async (
      id: string,
      params: Partial<Pick<BillingCycle, "opening_balance" | "minimum_payment" | "interest_rate" | "notes" | "status">>
    ): Promise<void> => {
      const now = Date.now();
      const sets: string[] = [];
      const values: (string | number | null)[] = [];

      if (params.opening_balance !== undefined) {
        sets.push("opening_balance = ?");
        values.push(params.opening_balance);
      }
      if (params.minimum_payment !== undefined) {
        sets.push("minimum_payment = ?");
        values.push(params.minimum_payment);
      }
      if (params.interest_rate !== undefined) {
        sets.push("interest_rate = ?");
        values.push(params.interest_rate);
      }
      if (params.notes !== undefined) {
        sets.push("notes = ?");
        values.push(params.notes ?? null);
      }
      if (params.status !== undefined) {
        sets.push("status = ?");
        values.push(params.status);
      }
      if (sets.length === 0) return;

      sets.push("updated_at = ?");
      values.push(now);
      values.push(id);

      await db.runAsync(
        `UPDATE billing_cycles SET ${sets.join(", ")} WHERE id = ?`,
        values
      );
    };

    const deleteCycle = async (id: string): Promise<void> => {
      await db.runAsync("DELETE FROM billing_cycles WHERE id = ?", [id]);
    };

    const deleteAllCycles = async (walletId: string): Promise<void> => {
      await db.runAsync("DELETE FROM billing_cycles WHERE wallet_id = ?", [walletId]);
    };

    const hasCycles = async (walletId: string): Promise<boolean> => {
      const row = await db.getFirstAsync<{ n: number }>(
        "SELECT COUNT(*) as n FROM billing_cycles WHERE wallet_id = ?",
        [walletId]
      );
      return (row?.n ?? 0) > 0;
    };

    return {
      getCycles,
      getActiveCycle,
      createCycle,
      bulkCreateCycles,
      closeCycle,
      autoCloseExpiredCycles,
      updateCycle,
      deleteCycle,
      deleteAllCycles,
      hasCycles,
    };
  }, [db]);
}
