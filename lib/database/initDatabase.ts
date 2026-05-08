import { SQLiteDatabase } from "expo-sqlite";
import uuid from "react-native-uuid";

const DATABASE_VERSION = 16;

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  const data = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");
  const currentVersion = data?.user_version || 0;

  if (currentVersion >= DATABASE_VERSION) {
    console.log("La base de datos ya está en la versión más reciente");
    return;
  }

  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await db.withTransactionAsync(async () => {
    if (__DEV__ && currentVersion > 0 && currentVersion < DATABASE_VERSION) {
      console.log("⚠️ Modo desarrollo: Recreando tablas desde versión", currentVersion);
      await db.execAsync("DROP TABLE IF EXISTS transaction_labels");
      await db.execAsync("DROP TABLE IF EXISTS labels");
      await db.execAsync("DROP TABLE IF EXISTS category_budget_limits");
      await db.execAsync("DROP TABLE IF EXISTS transactions");
      await db.execAsync("DROP TABLE IF EXISTS budgets");
      await db.execAsync("DROP TABLE IF EXISTS objectives");
      await db.execAsync("DROP TABLE IF EXISTS categories");
      await db.execAsync("DROP TABLE IF EXISTS wallets");
      await db.execAsync("DROP TABLE IF EXISTS credit_cards");
      await db.execAsync("DROP TABLE IF EXISTS chat_messages");
      await db.execAsync("DROP TABLE IF EXISTS user_settings");
      await db.execAsync("DROP TABLE IF EXISTS widget_settings");
      await db.execAsync("DROP TABLE IF EXISTS investments");
      await db.execAsync("DROP TABLE IF EXISTS investment_history");
    } else if (__DEV__ && currentVersion === 0) {
      // Solo la primera vez en dev: limpia tablas pero no recrea estructura cada vez
      console.log("⚠️ Modo desarrollo: Recreando tablas desde version 0");
      await db.execAsync("DROP TABLE IF EXISTS transaction_labels");
      await db.execAsync("DROP TABLE IF EXISTS labels");
      await db.execAsync("DROP TABLE IF EXISTS category_budget_limits");
      await db.execAsync("DROP TABLE IF EXISTS transactions");
      await db.execAsync("DROP TABLE IF EXISTS budgets");
      await db.execAsync("DROP TABLE IF EXISTS objectives");
      await db.execAsync("DROP TABLE IF EXISTS categories");
      await db.execAsync("DROP TABLE IF EXISTS wallets");
      await db.execAsync("DROP TABLE IF EXISTS credit_cards");
      await db.execAsync("DROP TABLE IF EXISTS chat_messages");
      await db.execAsync("DROP TABLE IF EXISTS user_settings");
      await db.execAsync("DROP TABLE IF EXISTS widget_settings");
      await db.execAsync("DROP TABLE IF EXISTS investments");
      await db.execAsync("DROP TABLE IF EXISTS investment_history");
    } else if (!__DEV__ && currentVersion > 0 && currentVersion < DATABASE_VERSION) {
      console.log("📱 Producción: Actualizando esquema de base de datos de versión", currentVersion, "a", DATABASE_VERSION);
      if (currentVersion < 16) {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS investment_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL
          )
        `);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            principal REAL NOT NULL,
            annual_rate REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'MXN',
            wallet_id TEXT,
            type_id TEXT DEFAULT 'rfija',
            shares REAL,
            is_frozen INTEGER NOT NULL DEFAULT 0,
            icon TEXT NOT NULL DEFAULT '📈',
            color TEXT NOT NULL DEFAULT 'green',
            start_date INTEGER NOT NULL,
            current_value REAL NOT NULL,
            last_compound_date INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            notes TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
            FOREIGN KEY (type_id) REFERENCES investment_types(id)
          )
        `);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS investment_history (
            id TEXT PRIMARY KEY,
            investment_id TEXT NOT NULL,
            date INTEGER NOT NULL,
            value REAL NOT NULL,
            FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
          )
        `);
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_investment_history_inv ON investment_history(investment_id, date)
        `);
      }
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'MXN',
        icon TEXT,
        color TEXT,
        type TEXT NOT NULL DEFAULT 'regular' CHECK(type IN ('regular', 'credit')),
        bank TEXT,
        last_four_digits TEXT,
        credit_limit REAL DEFAULT 0,
        cut_off_day INTEGER,
        payment_due_day INTEGER,
        interest_rate REAL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

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
        to_wallet_id TEXT,
        objective_id TEXT,
        is_subscription INTEGER NOT NULL DEFAULT 0,
        subscription_frequency TEXT CHECK(subscription_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        next_payment_date INTEGER,
        end_date INTEGER,
        is_excluded INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local',
        FOREIGN KEY (wallet_id) REFERENCES wallets (id),
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (to_wallet_id) REFERENCES wallets (id),
        FOREIGN KEY (objective_id) REFERENCES objectives (id)
      )
    `);

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

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS objectives (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        type TEXT NOT NULL CHECK(type IN ('savings', 'debt')),
        credit_wallet_id TEXT,
        due_date INTEGER,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local',
        FOREIGN KEY (credit_wallet_id) REFERENCES wallets (id)
      )
    `);

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

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY DEFAULT 'main',
        user_name TEXT,
        default_currency TEXT NOT NULL DEFAULT 'MXN',
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS widget_settings (
        id TEXT PRIMARY KEY,
        widget_type TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        position INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS credit_cards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bank TEXT,
        last_four_digits TEXT,
        credit_limit REAL NOT NULL DEFAULT 0,
        current_balance REAL NOT NULL DEFAULT 0,
        cut_off_day INTEGER NOT NULL DEFAULT 1,
        payment_due_day INTEGER NOT NULL DEFAULT 15,
        interest_rate REAL DEFAULT 0,
        color TEXT,
        icon TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        metadata TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        principal REAL NOT NULL,
        annual_rate REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MXN',
        wallet_id TEXT,
        type_id TEXT DEFAULT 'rfija',
        shares REAL,
        is_frozen INTEGER NOT NULL DEFAULT 0,
        icon TEXT NOT NULL DEFAULT '📈',
        color TEXT NOT NULL DEFAULT 'green',
        start_date INTEGER NOT NULL,
        current_value REAL NOT NULL,
        last_compound_date INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
        FOREIGN KEY (type_id) REFERENCES investment_types(id)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS investment_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `);

    await db.execAsync(`
      INSERT OR IGNORE INTO investment_types (id, name, icon, color) VALUES
        ('rfija', 'Renta Fija', 'business', '#10B981'),
        ('cetes', 'CETES', 'government', '#0A84FF'),
        ('etf', 'ETF', 'trending-up', '#AF52DE'),
        ('crypto', 'Crypto', 'bitcoin', '#FF6B35')
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS investment_history (
        id TEXT PRIMARY KEY,
        investment_id TEXT NOT NULL,
        date INTEGER NOT NULL,
        value REAL NOT NULL,
        FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
      )
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_investment_history_inv ON investment_history(investment_id, date)
    `);

    await db.execAsync(`
      INSERT OR IGNORE INTO user_settings (id, default_currency, onboarding_completed)
      VALUES ('main', 'MXN', 0)
    `);

    const defaultWidgets = [
      { type: 'greeting', position: 0 },
      { type: 'accounts', position: 1 },
      { type: 'balance', position: 2 },
      { type: 'quick_actions', position: 3 },
      { type: 'credit_cards', position: 4 },
      { type: 'objectives', position: 5 },
      { type: 'transactions', position: 6 },
    ];

    for (const widget of defaultWidgets) {
      await db.execAsync(`
        INSERT OR IGNORE INTO widget_settings (id, widget_type, is_enabled, position)
        VALUES ('${uuid.v4()}', '${widget.type}', 1, ${widget.position})
      `);
    }

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

    const incomeCategories = [
      { name: "Salario", icon: "💰", color: "#4ECDC4" },
      { name: "Freelance", icon: "💻", color: "#FFD166" },
      { name: "Regalos", icon: "🎁", color: "#FF6B6B" },
      { name: "Inversión", icon: "📈", color: "#F9C80E" },
      { name: "Reembolso", icon: "💸", color: "#FF9F1C" },
      { name: "Otros Ingresos", icon: "💭", color: "#4ECDC4" }
    ];

    for (const category of expenseCategories) {
      await db.execAsync(`
        INSERT INTO categories (id, name, icon, color, is_custom, is_income) 
        SELECT '${uuid.v4()}', '${category.name}', '${category.icon}', '${category.color}', 0, 0
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${category.name}' AND is_income = 0);
      `);
    }

    for (const category of incomeCategories) {
      await db.execAsync(`
        INSERT INTO categories (id, name, icon, color, is_custom, is_income)
        SELECT '${uuid.v4()}', '${category.name}', '${category.icon}', '${category.color}', 0, 1
        WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${category.name}' AND is_income = 1);
      `);
    }

    const creditCardCount = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM credit_cards WHERE 1=1"
    );

    if (creditCardCount && creditCardCount.count > 0) {
      await db.execAsync(`
        INSERT INTO wallets (
          id, name, balance, currency, icon, color, type,
          bank, last_four_digits, credit_limit,
          cut_off_day, payment_due_day, interest_rate,
          is_archived, created_at, updated_at, sync_status
        )
        SELECT
          id,
          name,
          current_balance as balance,
          COALESCE((SELECT default_currency FROM user_settings WHERE id = 'main'), 'MXN') as currency,
          COALESCE(icon, '💳') as icon,
          COALESCE(color, '#FF6B6B') as color,
          'credit' as type,
          bank,
          last_four_digits,
          credit_limit,
          cut_off_day,
          payment_due_day,
          interest_rate,
          is_archived,
          created_at,
          updated_at,
          sync_status
        FROM credit_cards
        WHERE NOT EXISTS (
          SELECT 1 FROM wallets WHERE wallets.id = credit_cards.id
        );
      `);
    }

    await db.execAsync(`
      INSERT INTO wallets (id, name, balance, currency, icon, color)
      SELECT '${uuid.v4()}', 'Bank', 0.0, COALESCE((SELECT default_currency FROM user_settings WHERE id = 'main'), 'MXN'), '🏦', '#4CAF50'
      WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE name = 'Bank');
    `);
  });

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

  if (__DEV__) {
    const { generateAllSampleData } = await import('../devSampleData');
    await generateAllSampleData(db);
  }
}