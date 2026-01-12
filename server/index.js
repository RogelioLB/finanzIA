
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { openai } from "@ai-sdk/openai";
import { streamText, generateObject } from "ai";
import { z } from 'zod';
import { buildFinancialContext } from './contextBuilder.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// System prompt para la IA (Copiado del original)
const getSystemPrompt = (financialContextSummary) => `Eres un asistente financiero personal amigable y experto. Ayudas a los usuarios a entender y mejorar sus finanzas personales de manera conversacional.

CONTEXTO FINANCIERO ACTUAL DEL USUARIO:
${financialContextSummary}

TUS CAPACIDADES:
1. Responder preguntas específicas sobre transacciones, gastos, ingresos y patrones de gasto
2. Analizar la situación financiera del usuario con datos reales
3. Generar visualizaciones útiles cuando sea necesario (gráficos, tablas, calendarios)
4. Crear planes de pago personalizados para deudas y tarjetas de crédito
5. Sugerir objetivos de ahorro alcanzables basados en el historial
6. Dar recomendaciones prácticas y accionables
7. Explicar conceptos financieros de manera simple
8. Responder SIEMPRE en español (México)

FORMATO DE RESPUESTA:
- Sé conversacional, amigable y conciso
- Usa DATOS ESPECÍFICOS del usuario (no genéricos)
- Cuando sea útil para la comprensión, incluye visualizaciones usando estos marcadores especiales:

  Para gráficos de pastel:
  [CHART:PIE:{"title":"Título del gráfico","data":[{"value":5000,"label":"Etiqueta","color":"#FF6B6B"},{"value":3000,"label":"Otra etiqueta","color":"#4ECDC4"}]}]

  Para gráficos de barras:
  [CHART:BAR:{"title":"Título del gráfico","data":[{"value":5000,"label":"Enero","frontColor":"#7952FC"},{"value":4000,"label":"Febrero","frontColor":"#4ECDC4"}]}]

  Para tablas:
  [TABLE:{"headers":["Concepto","Fecha","Monto"],"rows":[["BBVA Tarjeta","15 Ene","$5,000"],["Netflix","5 Ene","$199"]]}]

  Para acciones (guardar plan como objetivo):
  [ACTION:SAVE_OBJECTIVE:{"title":"Pagar BBVA Oro","amount":15000,"type":"debt"}]

INSTRUCCIONES IMPORTANTES:
- Siempre usa datos REALES del usuario proporcionados en el contexto
- No inventes números o información - si no tienes datos, pregunta al usuario
- Cuando sugieras un plan (ej: plan de pagos), include un botón [ACTION:...] para que pueda guardarlo
- Sé específico con fechas, montos y porcentajes
- Mantén las respuestas enfocadas y accionables (máximo 3-4 párrafos)
- Si el usuario pregunta sobre un aspecto que no tiene datos, sugiere qué información podría ayudarte
- Para planes de pago, siempre considera el flujo de caja (ingresos vs gastos mensuales)
- Prioriza las deudas de mayor interés en los planes de pago (estrategia Avalanche)

Recuerda: El usuario depende de tu análisis para tomar decisiones financieras reales. Sé preciso, honesto y siempre basa tus recomendaciones en los datos proporcionados.`;

app.get('/', (req, res) => {
  res.send('FinanzIA Chat API is running');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, financialContext } = req.body;

    if (!financialContext || !financialContext.transactions) {
      return res.status(400).json({ error: "Contexto financiero no proporcionado" });
    }

    // No hay mínimo, el asistente usará lo que tenga disponible.
    // El contextBuilder se encarga de limitar a las más recientes.

    // Construir contexto financiero
    const financialContextSummary = buildFinancialContext(financialContext);

    // Llamar a OpenAI con streaming
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: getSystemPrompt(financialContextSummary),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
    });

    // Retornar respuesta streameada
    result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error("[Chat API Error]", error);
    res.status(500).json({ error: "Error procesando tu solicitud" });
  }
});

app.post('/api/generate-plan', async (req, res) => {
  try {
    const { transactions, totalBalance, transactionCount, objectives, creditCards } = req.body;

    // No hay mínimo, generamos con lo que haya disponible.

    // Filtrar solo transacciones NO excluidas para cálculos de balance
    const includedTransactions = transactions.filter((t) => t.is_excluded === 0);

    // Calcular estadísticas básicas (solo transacciones incluidas)
    const income = includedTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = includedTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Agrupar por categoría con conteo
    const categoryData = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const category = t.category || t.category_name || 'Sin categoría';
        if (!categoryData[category]) {
          categoryData[category] = { total: 0, count: 0, transactions: [] };
        }
        categoryData[category].total += t.amount;
        categoryData[category].count += 1;
        categoryData[category].transactions.push(t.amount);
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
    const subscriptions = transactions.filter((t) =>
      t.is_subscription === 1 && t.subscription_frequency && t.subscription_frequency !== 'once'
    );
    const debts = transactions.filter((t) =>
      t.is_subscription === 1 && (!t.subscription_frequency || t.subscription_frequency === 'once')
    );

    const subscriptionSummary = subscriptions.reduce((acc, t) => {
      const key = t.title || t.category;
      if (!acc[key]) {
        acc[key] = { amount: t.amount, frequency: t.subscription_frequency || 'mensual', count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const debtSummary = debts.reduce((acc, t) => {
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
      .map((t) => {
        const isDebt = t.is_subscription === 1 && (!t.subscription_frequency || t.subscription_frequency === 'once');
        return {
          a: t.amount, // amount
          t: t.type === 'income' ? 'i' : 'e', // type (i=income, e=expense)
          c: t.category || t.category_name || 'Sin categoría', // category
          ti: t.title || '', // title
          d: new Date(t.timestamp).toISOString().split('T')[0], // date (YYYY-MM-DD)
          s: t.is_subscription === 1 && !isDebt ? 'S' : '', // subscription (recurring)
          dt: isDebt ? 'D' : '', // debt (single payment subscription)
          ex: t.is_excluded === 1 ? 'X' : '', // excluded
        };
      });

    // Procesar objetivos del usuario
    const userObjectives = objectives || [];
    const savingsGoals = userObjectives.filter((o) => o.type === 'savings');
    const userDebts = userObjectives.filter((o) => o.type === 'debt');

    const totalDebtRemaining = userDebts.reduce((sum, d) =>
      sum + Math.max(0, d.amount - d.current_amount), 0);
    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalSavingsGoal = savingsGoals.reduce((sum, g) => sum + g.amount, 0);

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
${Object.entries(subscriptionSummary).map(([name, data]) =>
      `- ${name}: $${data.amount.toFixed(2)} ${data.frequency} (${data.count} pagos registrados)`
    ).join('\n')}
Gasto mensual estimado en suscripciones: $${subscriptions.reduce((sum, s) => {
      const multiplier = s.subscription_frequency === 'weekly' ? 4 : s.subscription_frequency === 'yearly' ? 1 / 12 : 1;
      return sum + (s.amount * multiplier);
    }, 0).toFixed(2)} MXN
` : ''}

${Object.keys(debtSummary).length > 0 ? `
DEUDAS/PAGOS ÚNICOS (${debts.length} total):
${Object.entries(debtSummary).map(([name, data]) => {
      const dueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : 'Sin fecha';
      return `- ${name}: $${data.total.toFixed(2)} total (${data.count} pagos) - Vencimiento: ${dueDate}`;
    }).join('\n')}
Total en deudas/pagos únicos: $${debts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} MXN
` : ''}

${userObjectives.length > 0 ? `
OBJETIVOS FINANCIEROS DEL USUARIO:

${savingsGoals.length > 0 ? `Metas de Ahorro (${savingsGoals.length}):
${savingsGoals.map((g) => {
      const remaining = g.amount - g.current_amount;
      const progress = (g.current_amount / (g.amount || 1) * 100).toFixed(0);
      const dueDate = g.due_date ? new Date(g.due_date).toISOString().split('T')[0] : 'Sin fecha';
      let monthlyNeeded = 0;
      if (g.due_date) {
        const msPerMonth = 30 * 24 * 60 * 60 * 1000;
        const monthsRemaining = Math.max(1, Math.ceil((g.due_date - Date.now()) / msPerMonth));
        monthlyNeeded = remaining / monthsRemaining;
      }
      return `- ${g.title}: $${g.current_amount.toFixed(2)}/$${g.amount.toFixed(2)} (${progress}%) - Restante: $${remaining.toFixed(2)} - Fecha: ${dueDate}${monthlyNeeded > 0 ? ` - Necesita: $${monthlyNeeded.toFixed(0)}/mes` : ''}`;
    }).join('\n')}
Total ahorrado: $${totalSaved.toFixed(2)} de $${totalSavingsGoal.toFixed(2)}
` : ''}

${userDebts.length > 0 ? `Deudas Registradas (${userDebts.length}):
${userDebts.map((d) => {
      const remaining = d.amount - d.current_amount;
      const progress = (d.current_amount / (d.amount || 1) * 100).toFixed(0);
      const dueDate = d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : 'Sin fecha';
      let monthlyNeeded = 0;
      if (d.due_date) {
        const msPerMonth = 30 * 24 * 60 * 60 * 1000;
        const monthsRemaining = Math.max(1, Math.ceil((d.due_date - Date.now()) / msPerMonth));
        monthlyNeeded = remaining / monthsRemaining;
      }
      return `- ${d.title}: Pagado $${d.current_amount.toFixed(2)} de $${d.amount.toFixed(2)} (${progress}%) - Restante: $${remaining.toFixed(2)} - Fecha límite: ${dueDate}${monthlyNeeded > 0 ? ` - Pago mensual necesario: $${monthlyNeeded.toFixed(0)}` : ''}`;
    }).join('\n')}
Total deuda pendiente: $${totalDebtRemaining.toFixed(2)}
` : ''}
` : ''}

${creditCards && creditCards.length > 0 ? `
TARJETAS DE CRÉDITO (${creditCards.length}):
${creditCards.map((card) => {
      const utilization = card.credit_limit > 0 ? ((card.current_balance / card.credit_limit) * 100).toFixed(1) : 0;
      const available = card.credit_limit - card.current_balance;
      return `- ${card.name}${card.bank ? ` (${card.bank})` : ''}:
  Límite: $${card.credit_limit.toLocaleString()} | Saldo: $${card.current_balance.toLocaleString()} | Disponible: $${available.toLocaleString()}
  Utilización: ${utilization}% | Tasa interés: ${card.interest_rate || 0}% anual
  Día corte: ${card.cut_off_day} | Día pago: ${card.payment_due_day}`;
    }).join('\n')}
Total deuda en tarjetas: $${creditCards.reduce((sum, c) => sum + c.current_balance, 0).toLocaleString()}
Total disponible: $${creditCards.reduce((sum, c) => sum + (c.credit_limit - c.current_balance), 0).toLocaleString()}
Utilización promedio: ${creditCards.length > 0 ? (creditCards.reduce((sum, c) => sum + (c.credit_limit > 0 ? (c.current_balance / c.credit_limit) * 100 : 0), 0) / creditCards.length).toFixed(1) : 0}%
` : ''}

TRANSACCIONES RECIENTES (últimas ${simplifiedTransactions.length}):
${simplifiedTransactions.map((t) => {
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
6. Si hay deudas del usuario O tarjetas de crédito con saldo, genera un plan detallado para pagarlas con:
   - Pagos mensuales necesarios por prioridad
   - Tiempo estimado para liquidar cada deuda/tarjeta
   - Estrategia de pago (avalancha = mayor interés primero, o bola de nieve = menor monto primero)
   - Total a pagar mensualmente para todas las deudas
   - Incluye las tarjetas de crédito con saldo en el plan de pagos ordenadas por prioridad
7. Si hay metas de ahorro del usuario, evalúa si son alcanzables y sugiere ajustes
8. Genera un calendario de pagos mensual que muestre qué pagar cada mes en orden de prioridad
9. Acciones concretas con plazos específicos (esta semana, este mes, próximo mes)

IMPORTANTE para objetivos del usuario:
- Considera los objetivos registrados por el usuario como prioridad
- Calcula si el ahorro actual es suficiente para cumplir las metas en el tiempo establecido
- Sugiere ajustes si las metas no son realistas con los ingresos actuales
- Para deudas y tarjetas, prioriza las de mayor interés o las más urgentes
- Si hay tarjetas de crédito, considera sus fechas de corte y pago para optimizar el flujo de efectivo
- Mantén la utilización de tarjetas por debajo del 30% como meta ideal

Sé específico, práctico y motivador. Usa datos reales del usuario. Enfócate en acciones concretas que el usuario puede tomar AHORA.`;

    // Definir schema con Zod
    const financialPlanSchema = z.object({
      summary: z.string(),
      monthlyBudget: z.object({
        income: z.number(),
        expenses: z.number(),
        savings: z.number(),
        savingsPercentage: z.number(),
      }),
      recommendations: z.array(
        z.object({
          category: z.string(),
          suggestion: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          potentialSavings: z.number().optional(),
        })
      ),
      spendingPatterns: z.array(
        z.object({
          category: z.string(),
          percentage: z.number(),
          trend: z.enum(['increasing', 'stable', 'decreasing']),
        })
      ),
      goals: z.array(
        z.object({
          title: z.string(),
          targetAmount: z.number(),
          monthsToAchieve: z.number(),
          monthlySavingsNeeded: z.number(),
        })
      ),
      debtPayoffPlan: z.object({
        totalDebt: z.number(),
        monthlyPaymentNeeded: z.number(),
        estimatedPayoffMonths: z.number(),
        strategy: z.enum(['avalanche', 'snowball']),
        strategyExplanation: z.string(),
        debts: z.array(
          z.object({
            name: z.string(),
            remainingAmount: z.number(),
            monthlyPayment: z.number(),
            payoffMonths: z.number(),
            priority: z.number(),
          })
        ),
      }).optional(),
      actionItems: z.array(
        z.object({
          action: z.string(),
          impact: z.enum(['high', 'medium', 'low']),
          timeframe: z.string(),
        })
      ),
      paymentSchedule: z.array(
        z.object({
          month: z.number(),
          payments: z.array(
            z.object({
              name: z.string(),
              amount: z.number(),
              type: z.enum(['credit_card', 'debt', 'savings']),
              isComplete: z.boolean(),
            })
          ),
          totalPayment: z.number(),
          remainingDebt: z.number(),
        })
      ).optional(),
      creditCardStrategy: z.object({
        totalCreditDebt: z.number(),
        averageUtilization: z.number(),
        targetUtilization: z.number(),
        monthlyPaymentNeeded: z.number(),
        priorityOrder: z.array(
          z.object({
            cardName: z.string(),
            currentBalance: z.number(),
            interestRate: z.number(),
            priority: z.number(),
            reason: z.string(),
          })
        ),
      }).optional(),
    });

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: financialPlanSchema,
      prompt,
    });

    res.json({ plan: object });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Error al generar el plan financiero' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

