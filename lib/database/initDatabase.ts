import { SQLiteDatabase } from "expo-sqlite";
import uuid from "react-native-uuid";

/**
 * Constante para la versión actual de la base de datos
 * Incrementar cuando se realicen cambios en el esquema
 */
const DATABASE_VERSION = 5;

/**
 * Inicializa la estructura de la base de datos
 * @param db Instancia de la base de datos proporcionada por SQLiteProvider
 */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  // Obtener la versión actual de la base de datos
  const data = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");
  const currentVersion = data?.user_version || 0;

  // Si la versión es la actual, no es necesario hacer nada
  if (currentVersion >= DATABASE_VERSION) {
    console.log("La base de datos ya está en la versión más reciente");
    return;
  }

  // Activamos el modo WAL y las claves foráneas
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Crear tablas en una transacción para garantizar la consistencia
  await db.withTransactionAsync(async () => {
    // Si estamos actualizando desde una versión anterior, eliminamos las tablas existentes
    if (currentVersion < DATABASE_VERSION) {
      await db.execAsync("DROP TABLE IF EXISTS transaction_labels");
      await db.execAsync("DROP TABLE IF EXISTS labels");
      await db.execAsync("DROP TABLE IF EXISTS category_budget_limits");
      await db.execAsync("DROP TABLE IF EXISTS transactions");
      await db.execAsync("DROP TABLE IF EXISTS budgets");
      await db.execAsync("DROP TABLE IF EXISTS objectives");
      await db.execAsync("DROP TABLE IF EXISTS categories");
      await db.execAsync("DROP TABLE IF EXISTS wallets");
    }

    // Tabla de wallets (billeteras)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        icon TEXT,
        color TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Tabla de categorías
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        is_custom INTEGER NOT NULL DEFAULT 1,
        is_income INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Tabla de transacciones
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
        title TEXT NOT NULL,
        note TEXT,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        category_id TEXT,
        to_wallet_id TEXT, -- Para transferencias entre wallets
        is_subscription INTEGER NOT NULL DEFAULT 0,
        subscription_frequency TEXT CHECK(subscription_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        end_date INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local',
        FOREIGN KEY (wallet_id) REFERENCES wallets (id),
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (to_wallet_id) REFERENCES wallets (id)
      )
    `);

    // Tabla de presupuestos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Tabla de límites de presupuesto por categoría
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS category_budget_limits (
        id TEXT PRIMARY KEY,
        budget_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local',
        FOREIGN KEY (budget_id) REFERENCES budgets (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Tabla de objetivos financieros
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS objectives (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        type TEXT NOT NULL CHECK(type IN ('savings', 'debt')),
        due_date INTEGER,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Tabla para etiquetas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS labels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Tabla para relacionar transacciones con etiquetas (many-to-many)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transaction_labels (
        transaction_id TEXT NOT NULL,
        label_id TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        PRIMARY KEY (transaction_id, label_id),
        FOREIGN KEY (transaction_id) REFERENCES transactions (id),
        FOREIGN KEY (label_id) REFERENCES labels (id)
      )
    `);

    // Insertamos categorías predefinidas para gastos
    const expenseCategories = [
      { name: "Comida", icon: "🍔", color: "#FF6B6B" },
      { name: "Transporte", icon: "🚗", color: "#4ECDC4" },
      { name: "Entretenimiento", icon: "🎬", color: "#FFD166" },
      { name: "Compras", icon: "🛍️", color: "#F9C80E" },
      { name: "Servicios", icon: "💡", color: "#FF9F1C" },
      { name: "Salud", icon: "💊", color: "#FF6B6B" },
      { name: "Casa", icon: "🏠", color: "#4ECDC4" },
      { name: "Educación", icon: "📚", color: "#F9C80E" },
      { name: "Otros Gastos", icon: "💭", color: "#FF9F1C" }
    ];
    
    // Insertamos categorías predefinidas para ingresos
    const incomeCategories = [
      { name: "Salario", icon: "💰", color: "#4ECDC4" },
      { name: "Freelance", icon: "💻", color: "#FFD166" },
      { name: "Regalos", icon: "🎁", color: "#FF6B6B" },
      { name: "Inversión", icon: "📈", color: "#F9C80E" },
      { name: "Reembolso", icon: "💸", color: "#FF9F1C" },
      { name: "Otros Ingresos", icon: "💭", color: "#4ECDC4" }
    ];
    
    // Insertar categorías de gastos
    for (const category of expenseCategories) {
      await db.execAsync(`
        INSERT INTO categories (id, name, icon, color, is_custom, is_income) 
        SELECT '${uuid.v4()}', '${category.name}', '${category.icon}', '${category.color}', 0, 0
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${category.name}' AND is_income = 0);
      `);
    }
    
    // Insertar categorías de ingresos
    for (const category of incomeCategories) {
      await db.execAsync(`
        INSERT INTO categories (id, name, icon, color, is_custom, is_income) 
        SELECT '${uuid.v4()}', '${category.name}', '${category.icon}', '${category.color}', 0, 1
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${category.name}' AND is_income = 1);
      `);
    }

    // Insertamos una wallet por defecto si la tabla está vacía
    await db.execAsync(`
      INSERT INTO wallets (id, name, balance, currency, icon, color) 
      SELECT '${uuid.v4()}', 'Bank', 0.0, 'USD', '🏦', '#4CAF50'
      WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE name = 'Bank');
    `);
  });

  // Actualizar la versión de la base de datos al finalizar
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
