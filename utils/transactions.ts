/**
 * Filtra transacciones por rango de fechas
 * @param transactions - Array de transacciones
 * @param startDate - Fecha de inicio (timestamp)
 * @param endDate - Fecha de fin (timestamp)
 * @returns Array de transacciones filtradas
 */
export const filterTransactionsByDateRange = <T extends { timestamp: number }>(
  transactions: T[],
  startDate: number,
  endDate: number
): T[] => {
  return transactions.filter(
    transaction => transaction.timestamp >= startDate && transaction.timestamp <= endDate
  );
};

/**
 * Filtra transacciones por mes y año
 * @param transactions - Array de transacciones
 * @param month - Mes (0-11)
 * @param year - Año
 * @returns Array de transacciones filtradas
 */
export const filterTransactionsByMonth = <T extends { timestamp: number }>(
  transactions: T[],
  month: number,
  year: number
): T[] => {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.timestamp);
    return (
      transactionDate.getMonth() === month &&
      transactionDate.getFullYear() === year
    );
  });
};

/**
 * Agrupa transacciones por tipo (income/expense)
 * @param transactions - Array de transacciones
 * @returns Objeto con transacciones agrupadas por tipo
 */
export const groupTransactionsByType = <T extends { type: string }>(
  transactions: T[]
) => {
  return transactions.reduce((acc, transaction) => {
    if (!acc[transaction.type]) {
      acc[transaction.type] = [];
    }
    acc[transaction.type].push(transaction);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Calcula estadísticas de un array de transacciones
 * @param transactions - Array de transacciones
 * @returns Objeto con estadísticas calculadas
 */
export const calculateTransactionStats = <T extends { amount: number; type: string }>(
  transactions: T[]
) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    net: income - expenses,
    count: transactions.length,
    incomeCount: transactions.filter(t => t.type === 'income').length,
    expenseCount: transactions.filter(t => t.type === 'expense').length,
  };
};

/**
 * Ordena transacciones por fecha (más recientes primero)
 * @param transactions - Array de transacciones
 * @returns Array de transacciones ordenadas
 */
export const sortTransactionsByDate = <T extends { timestamp: number }>(
  transactions: T[]
): T[] => {
  return [...transactions].sort((a, b) => b.timestamp - a.timestamp);
};
