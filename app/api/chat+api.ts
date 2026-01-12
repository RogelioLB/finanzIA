import { buildFinancialContext } from "@/lib/chat/contextBuilder";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Interfaz para el request body
interface ChatRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  financialContext: {
    transactions: any[];
    wallets: any[];
    objectives: any[];
    creditCards: any[];
  };
}

/**
 * POST /api/chat
 * Endpoint para chat streaming con IA sobre finanzas
 */
export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();

    // No hay mínimo, el asistente usará lo que tenga disponible.
    // Construir contexto financiero
    const financialContextSummary = buildFinancialContext(body.financialContext);

    // System prompt para la IA
    const systemPrompt = `Eres un asistente financiero personal amigable y experto. Ayudas a los usuarios a entender y mejorar sus finanzas personales de manera conversacional.

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

FORMATO DE RESPUESTA:
- Sé conversacional, amigable y conciso
- Usa DATOS ESPECÍFICOS del usuario (no genéricos)
- Responde SIEMPRE en español (México)
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

EJEMPLOS DE RESPUESTAS ÚTILES:

Pregunta: "¿Cuál es mi próximo pago?"
Respuesta: "Tu próximo pago es el **15 de enero** con tu tarjeta BBVA Oro. El pago mínimo es de **$2,500**, pero considerando tu flujo de caja, te recomiendo pagar **$5,000** para reducir intereses (36.5% anual).
[TABLE:...]"

Pregunta: "Analiza mis gastos"
Respuesta: "Analizando tus gastos del mes... Tu mayor gasto es en **Comida** con **$5,000** (27% de tus gastos).
[CHART:PIE:...]
Te sugiero reducir gastos en comida rápida o delivery. ¿Quieres un plan específico?"

Pregunta: "Dame un plan de pagos"
Respuesta: "Basado en tu situación financiera... te recomiendo la estrategia **Avalanche**:
[CHART:BAR:...]
[TABLE:...]
[ACTION:SAVE_OBJECTIVE:...]"

Recuerda: El usuario depende de tu análisis para tomar decisiones financieras reales. Sé preciso, honesto y siempre basa tus recomendaciones en los datos proporcionados.`;

    // Llamar a OpenAI con streaming
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: body.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      temperature: 0.7,
    });

    // Retornar respuesta streameada
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Chat API Error]", error);

    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Error procesando tu solicitud" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Exportar config para Expo Router
export const config = {
  runtime: "nodejs",
};
