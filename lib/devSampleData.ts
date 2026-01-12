import { SQLiteDatabase } from 'expo-sqlite';
import uuid from 'react-native-uuid';

const SAMPLE_TRANSACTIONS = [
  // Ingresos
  { title: "Salario mensual", amount: 25000, type: "income", categoryName: "Salario", daysAgo: 2 },
  { title: "Freelance - Proyecto web", amount: 8000, type: "income", categoryName: "Freelance", daysAgo: 15 },
  { title: "Bono extra", amount: 5000, type: "income", categoryName: "Salario", daysAgo: 20 },

  // Gastos diarios
  { title: "Café mañanero", amount: 65, type: "expense", categoryName: "Comida", daysAgo: 0 },
  { title: "Desayuno", amount: 180, type: "expense", categoryName: "Comida", daysAgo: 1 },
  { title: "Almuerzo en restaurante", amount: 320, type: "expense", categoryName: "Comida", daysAgo: 1 },
  { title: "Compra en tienda", amount: 450, type: "expense", categoryName: "Comida", daysAgo: 2 },
  { title: "Supermercado Walmart", amount: 1850, type: "expense", categoryName: "Comida", daysAgo: 3 },
  { title: "Uber al trabajo", amount: 120, type: "expense", categoryName: "Transporte", daysAgo: 0 },
  { title: "Gasolina", amount: 600, type: "expense", categoryName: "Transporte", daysAgo: 2 },
  { title: "Estacionamiento", amount: 150, type: "expense", categoryName: "Transporte", daysAgo: 4 },
  { title: "Uber de regreso", amount: 95, type: "expense", categoryName: "Transporte", daysAgo: 1 },

  // Entretenimiento
  { title: "Netflix", amount: 199, type: "expense", categoryName: "Entretenimiento", isSubscription: true, frequency: "monthly", daysAgo: 5 },
  { title: "Spotify Premium", amount: 115, type: "expense", categoryName: "Entretenimiento", isSubscription: true, frequency: "monthly", daysAgo: 5 },
  { title: "Entrada cine", amount: 250, type: "expense", categoryName: "Entretenimiento", daysAgo: 7 },
  { title: "Amazon Prime", amount: 99, type: "expense", categoryName: "Entretenimiento", isSubscription: true, frequency: "monthly", daysAgo: 10 },
  { title: "Videojuegos", amount: 500, type: "expense", categoryName: "Entretenimiento", daysAgo: 12 },

  // Servicios
  { title: "Factura de internet", amount: 599, type: "expense", categoryName: "Servicios", isSubscription: true, frequency: "monthly", daysAgo: 8 },
  { title: "Factura de luz", amount: 450, type: "expense", categoryName: "Servicios", daysAgo: 6 },
  { title: "Factura de agua", amount: 280, type: "expense", categoryName: "Servicios", daysAgo: 6 },
  { title: "Teléfono celular", amount: 499, type: "expense", categoryName: "Servicios", isSubscription: true, frequency: "monthly", daysAgo: 8 },

  // Salud y bienestar
  { title: "Gimnasio mensual", amount: 599, type: "expense", categoryName: "Salud", isSubscription: true, frequency: "monthly", daysAgo: 9 },
  { title: "Farmacia", amount: 320, type: "expense", categoryName: "Salud", daysAgo: 4 },
  { title: "Doctor", amount: 500, type: "expense", categoryName: "Salud", daysAgo: 10 },
  { title: "Medicinas", amount: 180, type: "expense", categoryName: "Salud", daysAgo: 5 },

  // Compras
  { title: "Ropa H&M", amount: 1200, type: "expense", categoryName: "Compras", daysAgo: 5 },
  { title: "Zapatos Nike", amount: 1500, type: "expense", categoryName: "Compras", daysAgo: 12 },
  { title: "Accesorios", amount: 450, type: "expense", categoryName: "Compras", daysAgo: 8 },
  { title: "Bolsa nueva", amount: 800, type: "expense", categoryName: "Compras", daysAgo: 15 },

  // Otros gastos
  { title: "Regalo para amigo", amount: 600, type: "expense", categoryName: "Otros", daysAgo: 11 },
  { title: "Libros", amount: 450, type: "expense", categoryName: "Entretenimiento", daysAgo: 9 },
  { title: "Recarga de dinero digital", amount: 200, type: "expense", categoryName: "Otros", daysAgo: 13 },
];

export async function generateSampleTransactions(db: SQLiteDatabase): Promise<void> {
  try {
    // Verificar si ya hay transacciones
    const existingCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions"
    );

    if (existingCount && existingCount.count >= 15) {
      console.log('[DEV] Sample transactions already exist, skipping generation');
      return;
    }

    // Obtener la primera wallet disponible
    const wallet = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM wallets LIMIT 1"
    );

    if (!wallet) {
      console.log('[DEV] No wallet found, skipping sample transactions');
      return;
    }

    // Obtener categorías
    const categories = await db.getAllAsync<{ id: string; name: string; is_income: number }>(
      "SELECT id, name, is_income FROM categories"
    );

    const categoryMap = new Map<string, string>();
    const expenseCategoryMap = new Map<string, string>();
    const incomeCategoryMap = new Map<string, string>();

    categories.forEach(cat => {
      const key = cat.name.toLowerCase();
      categoryMap.set(key, cat.id);
      if (cat.is_income === 1) {
        incomeCategoryMap.set(key, cat.id);
      } else {
        expenseCategoryMap.set(key, cat.id);
      }
    });

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    console.log('[DEV] Generating sample transactions...');

    for (const sample of SAMPLE_TRANSACTIONS) {
      const timestamp = now - (sample.daysAgo * oneDay) - (Math.random() * 12 * 60 * 60 * 1000);

      // Find category ID
      let categoryId = null;
      for (const [name, id] of categoryMap.entries()) {
        if (sample.categoryName.toLowerCase().includes(name) ||
            name.includes(sample.categoryName.toLowerCase())) {
          categoryId = id;
          break;
        }
      }

      // Si no encontramos la categoría, buscar una por tipo
      if (!categoryId) {
        const isIncome = sample.type === 'income' ? 1 : 0;
        const defaultCat = await db.getFirstAsync<{ id: string }>(
          "SELECT id FROM categories WHERE is_income = ? LIMIT 1",
          [isIncome]
        );
        categoryId = defaultCat?.id || null;
      }

      const id = uuid.v4() as string;

      await db.runAsync(
        `INSERT INTO transactions (id, wallet_id, amount, type, title, timestamp, category_id, is_subscription, subscription_frequency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          wallet.id,
          sample.amount,
          sample.type,
          sample.title,
          Math.floor(timestamp),
          categoryId,
          sample.isSubscription ? 1 : 0,
          sample.frequency || null,
        ]
      );
    }

    console.log(`[DEV] Generated ${SAMPLE_TRANSACTIONS.length} sample transactions`);
  } catch (error) {
    console.error('[DEV] Error generating sample transactions:', error);
  }
}

export async function generateSampleCreditCards(db: SQLiteDatabase): Promise<void> {
  try {
    // Verificar si ya hay tarjetas
    const existingCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM credit_cards"
    );

    if (existingCount && existingCount.count > 0) {
      console.log('[DEV] Sample credit cards already exist, skipping generation');
      return;
    }

    const now = Date.now();

    const sampleCards = [
      {
        name: "Tarjeta Oro",
        bank: "BBVA",
        last_four_digits: "4521",
        credit_limit: 50000,
        current_balance: 15000, // 6 cuotas de ~2500 cada una
        cut_off_day: 15,
        payment_due_day: 5,
        interest_rate: 36.5,
        color: "#1E3A8A",
      },
      {
        name: "Platino",
        bank: "Santander",
        last_four_digits: "8832",
        credit_limit: 80000,
        current_balance: 28000, // 8 cuotas de ~3500 cada una
        cut_off_day: 20,
        payment_due_day: 10,
        interest_rate: 32.0,
        color: "#7952FC",
      },
      {
        name: "Cashback",
        bank: "Scotiabank",
        last_four_digits: "1234",
        credit_limit: 30000,
        current_balance: 8500, // 3 cuotas de ~2800 cada una
        cut_off_day: 10,
        payment_due_day: 28,
        interest_rate: 28.0,
        color: "#059669",
      },
    ];

    console.log('[DEV] Generating sample credit cards...');

    for (const card of sampleCards) {
      const id = uuid.v4() as string;
      await db.runAsync(
        `INSERT INTO credit_cards (id, name, bank, last_four_digits, credit_limit, current_balance, cut_off_day, payment_due_day, interest_rate, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          card.name,
          card.bank,
          card.last_four_digits,
          card.credit_limit,
          card.current_balance,
          card.cut_off_day,
          card.payment_due_day,
          card.interest_rate,
          card.color,
          now,
          now,
        ]
      );
    }

    console.log(`[DEV] Generated ${sampleCards.length} sample credit cards`);
  } catch (error) {
    console.error('[DEV] Error generating sample credit cards:', error);
  }
}

export async function generateSampleObjectives(db: SQLiteDatabase): Promise<void> {
  try {
    // Verificar si ya hay objetivos
    const existingCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM objectives"
    );

    if (existingCount && existingCount.count > 0) {
      console.log('[DEV] Sample objectives already exist, skipping generation');
      return;
    }

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    const sampleObjectives = [
      {
        title: "Fondo de emergencia",
        amount: 50000,
        current_amount: 15000,
        type: "savings",
        due_date: now + (6 * oneMonth),
        icon: "shield-checkmark",
        color: "#4CAF50",
      },
      {
        title: "Vacaciones Cancún",
        amount: 25000,
        current_amount: 8000,
        type: "savings",
        due_date: now + (4 * oneMonth),
        icon: "airplane",
        color: "#2196F3",
      },
      {
        title: "Préstamo banco",
        amount: 30000,
        current_amount: 10000,
        type: "debt",
        due_date: now + (8 * oneMonth),
        icon: "document-text",
        color: "#FF6B6B",
      },
      {
        title: "Deuda tarjeta vieja",
        amount: 12000,
        current_amount: 5000,
        type: "debt",
        due_date: now + (5 * oneMonth),
        icon: "card",
        color: "#FF9800",
      },
      {
        title: "Laptop nueva",
        amount: 15000,
        current_amount: 3000,
        type: "savings",
        due_date: now + (3 * oneMonth),
        icon: "laptop",
        color: "#9C27B0",
      },
    ];

    console.log('[DEV] Generating sample objectives...');

    for (const obj of sampleObjectives) {
      const id = uuid.v4() as string;
      await db.runAsync(
        `INSERT INTO objectives (id, title, amount, current_amount, type, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          obj.title,
          obj.amount,
          obj.current_amount,
          obj.type,
          obj.due_date,
          now,
          now,
        ]
      );
    }

    console.log(`[DEV] Generated ${sampleObjectives.length} sample objectives`);
  } catch (error) {
    console.error('[DEV] Error generating sample objectives:', error);
  }
}

export async function generateAllSampleData(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    console.log('[DEV] Not in development mode, skipping sample data generation');
    return;
  }

  console.log('[DEV] Starting sample data generation...');
  await generateSampleTransactions(db);
  await generateSampleCreditCards(db);
  await generateSampleObjectives(db);
  console.log('[DEV] Sample data generation complete');
}
