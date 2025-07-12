import * as SQLite from "expo-sqlite";

/**
 * Abre la base de datos SQLite
 *
 * @returns SQLite database object
 */
export function openDatabase() {
  const db = SQLite.openDatabaseSync("finance.db", { useNewConnection: true });
  return db;
}

/**
 * Inicializa la base de datos con las tablas necesarias
 */
export async function initDatabase() {
  const db = openDatabase();

  return new Promise<void>((resolve, reject) => {
    db.withTransactionAsync(async () => {
      // Tabla de cuentas
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'USD',
            color TEXT,
            icon TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            is_deleted INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'local',
            last_synced_at INTEGER
          );`
      );

      // Tabla de categorías
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            is_deleted INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'local',
            last_synced_at INTEGER
          );`
      );

      // Tabla de transacciones
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            category_id TEXT,
            amount REAL NOT NULL,
            description TEXT,
            date INTEGER NOT NULL,
            type TEXT NOT NULL,
            to_account_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            is_deleted INTEGER DEFAULT 0,
            sync_status TEXT DEFAULT 'local',
            last_synced_at INTEGER,
            FOREIGN KEY (account_id) REFERENCES accounts (id),
            FOREIGN KEY (category_id) REFERENCES categories (id),
            FOREIGN KEY (to_account_id) REFERENCES accounts (id)
          );`
      );

      // Insertar categorías predeterminadas si no existen
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, type, icon, color, created_at, updated_at)
          VALUES 
          ('cat_groceries', 'Groceries', 'expense', 'shopping-cart', '#4CAF50', ?, ?),
          ('cat_transport', 'Transport', 'expense', 'car', '#2196F3', ?, ?),
          ('cat_entertainment', 'Entertainment', 'expense', 'film', '#9C27B0', ?, ?),
          ('cat_restaurant', 'Restaurant', 'expense', 'restaurant', '#FF5722', ?, ?),
          ('cat_utilities', 'Utilities', 'expense', 'flash', '#607D8B', ?, ?),
          ('cat_salary', 'Salary', 'income', 'briefcase', '#4CAF50', ?, ?),
          ('cat_gifts', 'Gifts', 'income', 'gift', '#E91E63', ?, ?),
          ('cat_transfer', 'Transfer', 'transfer', 'repeat', '#7952FC', ?, ?)`,
        [
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
          Date.now(),
        ]
      );
    });
    resolve();
  });
}
