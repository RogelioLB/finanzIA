import { Transaction, Wallet } from "@/lib/database/sqliteService";

export interface FinancialData {
  transactions: Transaction[];
  wallets: Wallet[];
  objectives: any[];
  creditCards: any[];
}

/**
 * Construye un resumen financiero para enviar como contexto al IA
 */
export function buildFinancialContext(data: FinancialData): string {
  const { transactions, wallets, objectives, creditCards } = data;

  // Calcular período de últimos 30 días
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Filtrar transacciones de los últimos 30 días
  const last30Days = transactions.filter(
    (t) => t.timestamp >= thirtyDaysAgo && !t.is_excluded
  );

  // Calcular ingresos y gastos
  const monthlyIncome = last30Days
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = last30Days
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Calcular categorías principales
  const categoryTotals: Record<string, number> = {};
  last30Days
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const category = t.category_name || "Sin categoría";
      categoryTotals[category] = (categoryTotals[category] || 0) + t.amount;
    });

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Obtener próximos pagos
  const upcomingPayments = getUpcomingPayments(transactions, creditCards, objectives);

  // Formatear monedas
  const formatCurrency = (amount: number, currency: string = "MXN") =>
    `$${amount.toFixed(2)} ${currency}`;

  // Construir contexto
  let context = `RESUMEN FINANCIERO (últimos 30 días):
- Ingresos: ${formatCurrency(monthlyIncome)}
- Gastos: ${formatCurrency(monthlyExpenses)}
- Balance: ${formatCurrency(monthlyBalance)}
- Saldo neto del mes: ${((monthlyBalance / monthlyIncome) * 100).toFixed(1)}%

CUENTAS BANCARIAS:
${
  wallets.length > 0
    ? wallets
        .map((w) => `- ${w.name}: ${formatCurrency(w.net_balance || 0, w.currency)}`)
        .join("\n")
    : "- Ninguna registrada"
}

TARJETAS DE CRÉDITO:
${
  creditCards.length > 0
    ? creditCards
        .map((c) => {
          const utilization = ((c.current_balance / c.credit_limit) * 100).toFixed(1);
          return `- ${c.name} (${c.bank}): ${formatCurrency(c.current_balance)} de ${formatCurrency(c.credit_limit)} (${utilization}% utilización)`;
        })
        .join("\n")
    : "- Ninguna registrada"
}

OBJETIVOS ACTIVOS:
${
  objectives.filter((o: any) => !o.is_archived).length > 0
    ? objectives
        .filter((o: any) => !o.is_archived)
        .map((o: any) => {
          const progress = ((o.current_amount / o.amount) * 100).toFixed(1);
          const type = o.type === "debt" ? "Deuda" : "Ahorro";
          return `- ${o.title} (${type}): ${formatCurrency(o.current_amount)} de ${formatCurrency(o.amount)} (${progress}%)`;
        })
        .join("\n")
    : "- Ninguno registrado"
}

TOP 5 CATEGORÍAS DE GASTO:
${
  topCategories.length > 0
    ? topCategories
        .map(
          ([cat, total], i) =>
            `${i + 1}. ${cat}: ${formatCurrency(total)} (${((total / monthlyExpenses) * 100).toFixed(1)}%)`
        )
        .join("\n")
    : "- Sin gastos registrados"
}

PRÓXIMOS PAGOS (próximos 7 días):
${
  upcomingPayments.length > 0
    ? upcomingPayments
        .slice(0, 5)
        .map(
          (p) =>
            `- ${p.name}: ${formatCurrency(p.amount)} el ${new Date(p.date).toLocaleDateString("es-MX", {
              month: "short",
              day: "numeric",
            })}`
        )
        .join("\n")
    : "- Ninguno registrado"
}

ÚLTIMAS 10 TRANSACCIONES:
${
  transactions.slice(0, 10).length > 0
    ? transactions
        .slice(0, 10)
        .map((t) => {
          const date = new Date(t.timestamp).toLocaleDateString("es-MX");
          const icon = t.type === "income" ? "↓" : "↑";
          const category = t.category_name ? ` (${t.category_name})` : "";
          return `${date} | ${icon} ${t.type} ${category} - "${t.title}" | ${formatCurrency(t.amount)}`;
        })
        .join("\n")
    : "- Ninguna registrada"
}`;

  return context;
}

/**
 * Obtiene los próximos pagos de tarjetas de crédito y objetivos
 */
function getUpcomingPayments(
  transactions: Transaction[],
  creditCards: any[],
  objectives: any[]
): Array<{ name: string; amount: number; date: number; type: string }> {
  const payments: Array<{ name: string; amount: number; date: number; type: string }> = [];

  const now = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  // Próximos pagos de tarjetas de crédito
  creditCards.forEach((card) => {
    if (card.next_payment_date) {
      const daysUntilPayment = (card.next_payment_date - now) / (24 * 60 * 60 * 1000);
      if (daysUntilPayment > 0 && daysUntilPayment <= 7) {
        payments.push({
          name: `${card.name} (${card.bank})`,
          amount: card.current_balance > 0 ? Math.min(card.current_balance * 0.1, card.current_balance) : 0,
          date: card.next_payment_date,
          type: "credit_card",
        });
      }
    }
  });

  // Próximos pagos de suscripciones
  const nextSubscriptionPayments = transactions
    .filter((t) => t.is_subscription && t.next_payment_date && t.next_payment_date > now)
    .slice(0, 5)
    .map((t) => ({
      name: t.title,
      amount: t.amount,
      date: t.next_payment_date || now,
      type: "subscription",
    }));

  payments.push(...nextSubscriptionPayments);

  // Ordenar por fecha y retornar
  return payments.sort((a, b) => a.date - b.date);
}
