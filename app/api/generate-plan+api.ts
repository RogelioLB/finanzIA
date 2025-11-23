import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactions, totalBalance, transactionCount } = body;
    
    if (!transactions || transactions.length < 10) {
      return Response.json(
        { error: 'Se requieren al menos 10 transacciones para generar un plan' },
        { status: 400 }
      );
    }

    // Filtrar solo transacciones NO excluidas para cálculos de balance
    const includedTransactions = transactions.filter((t: any) => t.is_excluded === 0);
    
    // Calcular estadísticas básicas (solo transacciones incluidas)
    const income = includedTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const expenses = includedTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Agrupar por categoría con conteo
    const categoryData: Record<string, { total: number; count: number; transactions: number[] }> = {};
    transactions.forEach((t: any) => {
      if (t.type === 'expense') {
        if (!categoryData[t.category]) {
          categoryData[t.category] = { total: 0, count: 0, transactions: [] };
        }
        categoryData[t.category].total += t.amount;
        categoryData[t.category].count += 1;
        categoryData[t.category].transactions.push(t.amount);
      }
    });

    // Calcular promedios y variaciones por categoría
    const categoryStats = Object.entries(categoryData).map(([cat, data]) => {
      const avg = data.total / data.count;
      const amounts = data.transactions;
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      return {
        category: cat,
        total: data.total,
        count: data.count,
        avg: avg,
        min: min,
        max: max,
      };
    }).sort((a, b) => b.total - a.total);

    // Identificar suscripciones y deudas
    // Deudas = suscripciones de pago único (sin subscription_frequency o con 'once')
    const subscriptions = transactions.filter((t: any) => 
      t.is_subscription === 1 && t.subscription_frequency && t.subscription_frequency !== 'once'
    );
    const debts = transactions.filter((t: any) => 
      t.is_subscription === 1 && (!t.subscription_frequency || t.subscription_frequency === 'once')
    );
    
    const subscriptionSummary = subscriptions.reduce((acc: any, t: any) => {
      const key = t.title || t.category;
      if (!acc[key]) {
        acc[key] = { amount: t.amount, frequency: t.subscription_frequency || 'mensual', count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const debtSummary = debts.reduce((acc: any, t: any) => {
      const key = t.title || t.category;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0, dueDate: t.next_payment_date };
      }
      acc[key].total += t.amount;
      acc[key].count += 1;
      return acc;
    }, {});

    // Crear lista simplificada de transacciones (solo últimas 50 para no saturar)
    const simplifiedTransactions = transactions
      .slice(0, 50)
      .map((t: any) => {
        const isDebt = t.is_subscription === 1 && (!t.subscription_frequency || t.subscription_frequency === 'once');
        return {
          a: t.amount, // amount
          t: t.type === 'income' ? 'i' : 'e', // type (i=income, e=expense)
          c: t.category || 'Sin categoría', // category
          ti: t.title || '', // title
          d: new Date(t.timestamp).toISOString().split('T')[0], // date (YYYY-MM-DD)
          s: t.is_subscription === 1 && !isDebt ? 'S' : '', // subscription (recurring)
          dt: isDebt ? 'D' : '', // debt (single payment subscription)
          ex: t.is_excluded === 1 ? 'X' : '', // excluded
        };
      });

    // Crear prompt contextual con toda la información
    const prompt = `Eres un asesor financiero experto. Analiza las siguientes transacciones y genera un plan financiero personalizado en español.

RESUMEN GENERAL:
- Total de transacciones: ${transactionCount} (${includedTransactions.length} incluidas en balance, ${transactionCount - includedTransactions.length} pendientes/futuras)
- Ingresos totales: $${income.toFixed(2)} MXN
- Gastos totales: $${expenses.toFixed(2)} MXN
- Balance actual: $${totalBalance.toFixed(2)} MXN
- Ahorro neto: $${(income - expenses).toFixed(2)} MXN (${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%)

ANÁLISIS POR CATEGORÍA:
${categoryStats.map(cat => 
  `- ${cat.category}: $${cat.total.toFixed(2)} (${cat.count} transacciones, promedio: $${cat.avg.toFixed(2)}, rango: $${cat.min.toFixed(2)}-$${cat.max.toFixed(2)})`
).join('\n')}

${Object.keys(subscriptionSummary).length > 0 ? `
SUSCRIPCIONES ACTIVAS (${subscriptions.length} total):
${Object.entries(subscriptionSummary).map(([name, data]: [string, any]) => 
  `- ${name}: $${data.amount.toFixed(2)} ${data.frequency} (${data.count} pagos registrados)`
).join('\n')}
Gasto mensual estimado en suscripciones: $${subscriptions.reduce((sum: number, s: any) => {
  const multiplier = s.subscription_frequency === 'weekly' ? 4 : s.subscription_frequency === 'yearly' ? 1/12 : 1;
  return sum + (s.amount * multiplier);
}, 0).toFixed(2)} MXN
` : ''}

${Object.keys(debtSummary).length > 0 ? `
DEUDAS/PAGOS ÚNICOS (${debts.length} total):
${Object.entries(debtSummary).map(([name, data]: [string, any]) => {
  const dueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : 'Sin fecha';
  return `- ${name}: $${data.total.toFixed(2)} total (${data.count} pagos) - Vencimiento: ${dueDate}`;
}).join('\n')}
Total en deudas/pagos únicos: $${debts.reduce((sum: number, d: any) => sum + d.amount, 0).toFixed(2)} MXN
` : ''}

TRANSACCIONES RECIENTES (últimas ${simplifiedTransactions.length}):
${simplifiedTransactions.map((t: any) => {
  const flags = [t.s, t.dt, t.ex].filter(f => f).join(',');
  const title = t.ti ? ` - "${t.ti}"` : '';
  return `${t.d} | ${t.t === 'i' ? 'Ingreso' : 'Gasto'} | ${t.c}${title} | $${t.a.toFixed(2)}${flags ? ` [${flags}]` : ''}`;
}).join('\n')}
Leyenda: 
- S = Suscripción recurrente (mensual, semanal, anual)
- D = Deuda/Pago único (suscripción de un solo pago con fecha límite)
- X = Excluida del balance (pendiente de pago)

IMPORTANTE: 
- Las transacciones [X] son compromisos futuros que aún no se han pagado pero están programados.
- Las transacciones [D] son deudas o pagos únicos con fecha de vencimiento específica.
- Las transacciones [S] son suscripciones recurrentes que se cobran periódicamente.

Genera un plan financiero completo que incluya:
1. Un resumen general de la situación financiera (2-3 oraciones)
2. Presupuesto mensual estimado con porcentaje de ahorro
3. 3-5 recomendaciones específicas priorizadas (alta, media, baja) con ahorros potenciales
4. Patrones de gasto principales con tendencias
5. 2-3 metas financieras alcanzables con plazos y ahorros mensuales necesarios

Sé específico, práctico y motivador. Usa datos reales del usuario.`;

    // Definir schema con Zod
    const financialPlanSchema = z.object({
      summary: z.string().describe('Resumen general de la situación financiera del usuario'),
      monthlyBudget: z.object({
        income: z.number().describe('Ingresos mensuales promedio'),
        expenses: z.number().describe('Gastos mensuales promedio'),
        savings: z.number().describe('Ahorro mensual'),
        savingsPercentage: z.number().describe('Porcentaje de ahorro'),
      }),
      recommendations: z.array(
        z.object({
          category: z.string().describe('Categoría de la recomendación'),
          suggestion: z.string().describe('Sugerencia específica'),
          priority: z.enum(['high', 'medium', 'low']).describe('Prioridad de la recomendación'),
          potentialSavings: z.number().optional().describe('Ahorro potencial en pesos'),
        })
      ),
      spendingPatterns: z.array(
        z.object({
          category: z.string().describe('Categoría de gasto'),
          percentage: z.number().describe('Porcentaje del total'),
          trend: z.enum(['increasing', 'stable', 'decreasing']).describe('Tendencia del gasto'),
        })
      ),
      goals: z.array(
        z.object({
          title: z.string().describe('Título de la meta'),
          targetAmount: z.number().describe('Monto objetivo'),
          monthsToAchieve: z.number().describe('Meses para alcanzar'),
          monthlySavingsNeeded: z.number().describe('Ahorro mensual necesario'),
        })
      ),
    });


    const { object } = await generateObject({
      model: openai('gpt-5-mini'),
      schema: financialPlanSchema,
      prompt,
    });

    return Response.json({ plan: object });
  } catch (error) {
    console.error('Error generating plan:', error);
    return Response.json(
      { error: 'Error al generar el plan financiero' },
      { status: 500 }
    );
  }
}
