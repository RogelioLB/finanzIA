import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
}

export interface ParsedTransaction {
  amount: string;
  category: string;
  categoryId: string | null;
  note: string | undefined;
  type: 'expense' | 'income';
  confidence: number;
}

function createTransactionSchema(categories: Category[]) {
  const expenseCategories = categories
    .filter(c => c.type === 'expense')
    .map(c => c.name);
  
  const incomeCategories = categories
    .filter(c => c.type === 'income')
    .map(c => c.name);
  
  const allCategories = [...expenseCategories, ...incomeCategories];
  
  if (allCategories.length === 0) {
    return z.object({
      amount: z.string(),
      category: z.string(),
      note: z.string().optional(),
      type: z.enum(['expense', 'income']),
    });
  }
  
  return z.object({
    amount: z.string().describe('Monto de la transacción (solo el número)'),
    category: z.enum([...allCategories] as [string, ...string[]])
      .describe('Categoría de la transacción (usando exactamente los nombres del app)'),
    note: z.string().optional().describe('Nota o descripción adicional'),
    type: z.enum(['expense', 'income']).describe('Tipo de transacción'),
  });
}

export async function parseVoiceTransaction(
  text: string,
  apiKey: string,
  categories: Category[],
  modelName = 'gpt-4o-mini'
): Promise<ParsedTransaction> {
  const schema = createTransactionSchema(categories);
  
  const expenseList = categories
    .filter(c => c.type === 'expense')
    .map(c => c.name)
    .join(', ');
  
  const incomeList = categories
    .filter(c => c.type === 'income')
    .map(c => c.name)
    .join(', ');

  const systemPrompt = `Eres un asistente que parsea transcripciones de voz para extraer datos de transacciones financieras.
Tu trabajo es convertir lo que dice el usuario en datos estructurados.
Siempre usa exactamente los nombres de categorías proporcionados.`;

  const userPrompt = categories.length > 0
    ? `Parsea esta transcripción de voz y extrae los datos de la transacción.
    
Categorías de GASTOS disponibles: ${expenseList || 'Ninguna'}
Categorías de INGRESOS disponibles: ${incomeList || 'Ninguna'}

IMPORTANTE: La categoría DEBE ser exactamente una de las listadas arriba.
Si mencionaste algo similar a una categoría, usa el nombre exacto.
Si no hay categoría que coincida, usa la que más se acerque.

Transcripción: "${text}"

Responde con los datos de la transacción.`
    : `Parsea esta transcripción de voz y extrae los datos de la transacción.
    
Transcripción: "${text}"

Responde con los datos de la transacción.`;

  try {
    const openaiCustom = createOpenAI({ apiKey });
    
    const { object } = await generateObject({
      model: openaiCustom(modelName),
      schema,
      prompt: userPrompt,
      system: systemPrompt,
    });

    const categoryMatch = categories.find(
      c => c.name === object.category && c.type === object.type
    );

    return {
      amount: object.amount,
      category: object.category,
      categoryId: categoryMatch?.id || null,
      note: object.note,
      type: object.type,
      confidence: 0.9,
    };
  } catch (error) {
    console.error('[TransactionParser] Error:', error);
    throw error;
  }
}

export async function testLLMApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}