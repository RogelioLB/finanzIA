import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";

export interface Investment {
  id: string;
  name: string;
  principal: number;
  annual_rate: number;
  currency: string;
  wallet_id: string | null;
  icon: string;
  color: string;
  start_date: number;
  current_value: number;
  last_compound_date: number;
  is_active: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface InvestmentHistory {
  id: string;
  investment_id: string;
  date: number;
  value: number;
}

function getStartOfTodayMs(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function useInvestmentService() {
  const db = useSQLiteContext();

  const getInvestments = async (filters?: { is_active?: number }): Promise<Investment[]> => {
    let query = "SELECT * FROM investments";
    const params: any[] = [];

    if (filters?.is_active !== undefined) {
      query += " WHERE is_active = ?";
      params.push(filters.is_active);
    }

    query += " ORDER BY created_at DESC";
    return await db.getAllAsync<Investment>(query, params);
  };

  const getInvestmentById = async (id: string): Promise<Investment | null> => {
    return await db.getFirstAsync<Investment>(
      "SELECT * FROM investments WHERE id = ?",
      [id]
    );
  };

  const getActiveInvestments = async (): Promise<Investment[]> => {
    return await db.getAllAsync<Investment>(
      "SELECT * FROM investments WHERE is_active = 1 ORDER BY created_at DESC"
    );
  };

  const createInvestment = async (params: {
    name: string;
    principal: number;
    annual_rate: number;
    currency?: string;
    wallet_id?: string;
    icon?: string;
    color?: string;
    start_date?: number;
    notes?: string;
  }): Promise<string> => {
    const id = uuid.v4() as string;
    const now = Date.now();
    const startOfToday = getStartOfTodayMs();

    await db.runAsync(
      `INSERT INTO investments (
        id, name, principal, annual_rate, currency, wallet_id, icon, color,
        start_date, current_value, last_compound_date, is_active, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.name,
        params.principal,
        params.annual_rate,
        params.currency ?? 'MXN',
        params.wallet_id ?? null,
        params.icon ?? '📈',
        params.color ?? 'green',
        params.start_date ?? now,
        params.principal,
        params.start_date ? getStartOfTodayMs() : startOfToday,
        1,
        params.notes ?? null,
        now,
        now,
      ]
    );

    const historyId = uuid.v4() as string;
    await db.runAsync(
      "INSERT INTO investment_history (id, investment_id, date, value) VALUES (?, ?, ?, ?)",
      [historyId, id, params.start_date ? getStartOfTodayMs() : startOfToday, params.principal]
    );

    return id;
  };

  const updateInvestment = async (id: string, params: Partial<{
    name: string;
    annual_rate: number;
    wallet_id: string | null;
    icon: string;
    color: string;
    is_active: number;
    notes: string | null;
  }>): Promise<void> => {
    const updates: string[] = [];
    const values: any[] = [];

    if (params.name !== undefined) { updates.push("name = ?"); values.push(params.name); }
    if (params.annual_rate !== undefined) { updates.push("annual_rate = ?"); values.push(params.annual_rate); }
    if (params.wallet_id !== undefined) { updates.push("wallet_id = ?"); values.push(params.wallet_id); }
    if (params.icon !== undefined) { updates.push("icon = ?"); values.push(params.icon); }
    if (params.color !== undefined) { updates.push("color = ?"); values.push(params.color); }
    if (params.is_active !== undefined) { updates.push("is_active = ?"); values.push(params.is_active); }
    if (params.notes !== undefined) { updates.push("notes = ?"); values.push(params.notes); }

    updates.push("updated_at = ?");
    values.push(Date.now());
    values.push(id);

    await db.runAsync(
      `UPDATE investments SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
  };

  const deleteInvestment = async (id: string): Promise<void> => {
    await db.runAsync("DELETE FROM investment_history WHERE investment_id = ?", [id]);
    await db.runAsync("DELETE FROM investments WHERE id = ?", [id]);
  };

  const getInvestmentHistory = async (investmentId: string, days?: number): Promise<{ date: number; value: number }[]> => {
    let query = "SELECT date, value FROM investment_history WHERE investment_id = ?";
    const params: any[] = [investmentId];

    if (days) {
      const startDate = getStartOfTodayMs() - (days * 24 * 60 * 60 * 1000);
      query += " AND date >= ?";
      params.push(startDate);
    }

    query += " ORDER BY date ASC";
    return await db.getAllAsync<{ date: number; value: number }>(query, params);
  };

  const applyDailyCompound = async (investment: Investment, asOfMs?: number): Promise<Investment> => {
    const now = asOfMs ?? Date.now();
    const lastCompound = investment.last_compound_date;
    const startOfToday = getStartOfTodayMs();

    if (lastCompound >= startOfToday) {
      return investment;
    }

    const daysSinceLast = Math.floor((startOfToday - lastCompound) / (24 * 60 * 60 * 1000));

    if (daysSinceLast <= 0) {
      return investment;
    }

    const dailyRate = Math.pow(1 + investment.annual_rate / 100, 1 / 365) - 1;
    const newValue = investment.current_value * Math.pow(1 + dailyRate, daysSinceLast);

    const historyEntries: { id: string; date: number; value: number }[] = [];
    let cursorDate = lastCompound + (24 * 60 * 60 * 1000);

    for (let d = 0; d < daysSinceLast; d++) {
      const entryDate = new Date(cursorDate + d * (24 * 60 * 60 * 1000));
      const entryDateMs = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).getTime();
      const valueAtDay = investment.current_value * Math.pow(1 + dailyRate, d + 1);
      historyEntries.push({
        id: uuid.v4() as string,
        date: entryDateMs,
        value: valueAtDay,
      });
    }

    await db.withTransactionAsync(async () => {
      for (const entry of historyEntries) {
        await db.runAsync(
          "INSERT INTO investment_history (id, investment_id, date, value) VALUES (?, ?, ?, ?)",
          [entry.id, investment.id, entry.date, entry.value]
        );
      }

      await db.runAsync(
        "UPDATE investments SET current_value = ?, last_compound_date = ?, updated_at = ? WHERE id = ?",
        [newValue, startOfToday, Date.now(), investment.id]
      );
    });

    return { ...investment, current_value: newValue, last_compound_date: startOfToday };
  };

  const runDailyCompoundForAll = async (asOfMs?: number): Promise<{ updated: number }> => {
    const active = await getActiveInvestments();
    let updatedCount = 0;

    for (const inv of active) {
      const result = await applyDailyCompound(inv, asOfMs);
      if (result.current_value !== inv.current_value) {
        updatedCount++;
      }
    }

    return { updated: updatedCount };
  };

  return {
    getInvestments,
    getInvestmentById,
    getActiveInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    getInvestmentHistory,
    applyDailyCompound,
    runDailyCompoundForAll,
  };
}