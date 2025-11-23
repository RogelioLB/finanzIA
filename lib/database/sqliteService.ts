import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";
// Interfaces para los modelos de datos
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  is_archived?: number;
  created_at?: number;
  updated_at?: number;
  sync_status?: string;
  // Campo calculado (no almacenado en la base de datos)
  net_balance?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  is_custom: number;
  is_income: number;
  created_at: number;
  updated_at: number;
  sync_status: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string; // 'income', 'expense', 'transfer'
  title: string;
  note?: string;
  timestamp: number;
  category_id?: string;
  to_wallet_id?: string; // Para transferencias
  is_subscription: number;
  subscription_frequency?: string;
  next_payment_date?: number; // Fecha del próximo pago para suscripciones
  end_date?: number;
  is_excluded: number; // 1 si debe excluirse de cálculos (suscripciones no pagadas)
  created_at: number;
  updated_at: number;
  sync_status: string;
  // Campos adicionales de JOINs
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
  wallet_icon?: string;
  wallet_color?: string;
}

interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  created_at: number;
  updated_at: number;
  sync_status: string;
  spent_amount?: number;
  limits?: CategoryBudgetLimit[];
}

interface CategoryBudgetLimit {
  budget_id: string;
  category_id: string;
  amount: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  spent_amount?: number;
}

interface Objective {
  id: string;
  title: string;
  amount: number;
  current_amount: number;
  type: string;
  due_date?: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
  sync_status: string;
}

// Interfaces para parámetros de métodos
interface CreateWalletParams {
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
}

interface UpdateWalletParams {
  name: string;
  balance?: number; // Para permitir rebalanceo manual
  currency: string;
  icon: string;
  color: string;
  is_archived?: number;
}

interface CreateCategoryParams {
  name: string;
  is_income: number;
  icon?: string;
  color?: string;
}

interface UpdateCategoryParams {
  name?: string;
  is_income?: number;
  icon?: string;
  color?: string;
}

interface CreateTransactionParams {
  wallet_id: string;
  amount: number;
  type: string;
  title: string;
  note?: string;
  timestamp?: number;
  category_id?: string;
  to_wallet_id?: string;
  is_subscription?: number;
  subscription_frequency?: string;
  next_payment_date?: number;
  end_date?: number;
  is_excluded?: number;
}

interface UpdateTransactionParams {
  wallet_id?: string;
  amount?: number;
  type?: string;
  title?: string;
  note?: string;
  timestamp?: number;
  category_id?: string;
  to_wallet_id?: string;
  is_subscription?: number;
  subscription_frequency?: string;
  next_payment_date?: number;
  end_date?: number;
  is_excluded?: number;
}

interface CategoryLimit {
  category_id: string;
  amount: number;
}

interface CreateBudgetParams {
  amount: number;
  month: number;
  year: number;
  limits?: CategoryLimit[];
}

interface UpdateBudgetParams {
  amount?: number;
  month?: number;
  year?: number;
  limits?: CategoryLimit[];
}

interface CreateObjectiveParams {
  title: string;
  amount: number;
  current_amount?: number;
  type: string;
  due_date?: number;
}

interface UpdateObjectiveParams {
  title?: string;
  amount?: number;
  current_amount?: number;
  type?: string;
  due_date?: number;
}

/**
 * Hook para acceder a los servicios de la base de datos SQLite local
 * Proporciona métodos CRUD para las diferentes entidades
 */
export function useSQLiteService() {
  const db = useSQLiteContext();

  // ===== WALLETS =====

  /**
   * Calcula el balance neto de una wallet específica
   * Excluye transacciones marcadas con is_excluded = 1 (suscripciones no pagadas)
   */
  const calculateWalletBalance = async (walletId: string, initialBalance: number = 0): Promise<number> => {
    // Obtenemos la suma de ingresos (excluyendo transacciones marcadas como excluidas)
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE wallet_id = ? AND type = 'income' AND is_excluded = 0",
      [walletId]
    );
    const income = incomeResult?.total || 0;

    // Obtenemos la suma de gastos (excluyendo transacciones marcadas como excluidas)
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE wallet_id = ? AND type = 'expense' AND is_excluded = 0",
      [walletId]
    );
    const expense = expenseResult?.total || 0;

    // Calculamos el balance neto: balance inicial + ingresos - gastos
    return initialBalance + income - expense;
  };

  /**
   * Obtiene todas las billeteras con el balance neto calculado
   */
  const getWallets = async (): Promise<Wallet[]> => {
    const wallets = await db.getAllAsync<Wallet>(
      "SELECT * FROM wallets ORDER BY name ASC"
    );

    // Calculamos el balance neto para cada wallet usando la función centralizada
    for (const wallet of wallets) {
      wallet.net_balance = await calculateWalletBalance(wallet.id, wallet.balance);
    }

    return wallets;
  };

  /**
   * Obtiene una billetera por su ID con el balance neto calculado
   */
  const getWalletById = async (id: string): Promise<Wallet | null> => {
    const wallet = await db.getFirstAsync<Wallet>(
      "SELECT * FROM wallets WHERE id = ?",
      [id]
    );

    if (wallet) {
      // Calculamos el balance neto usando la función centralizada
      wallet.net_balance = await calculateWalletBalance(wallet.id, wallet.balance);
    }

    return wallet;
  };

  /**
   * Crea una nueva billetera con balance inicial
   * El balance establecido aquí es el principal que solo cambiará manualmente
   */
  const createWallet = async ({
    name,
    balance = 0,
    currency = "USD",
    icon = "🏦",
    color = "blue",
  }: CreateWalletParams): Promise<string> => {
    const id = uuid.v4();

    await db.runAsync(
      "INSERT INTO wallets (id, name, balance, currency, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, balance, currency, icon, color]
    );

    return id;
  };

  /**
   * Actualiza una billetera existente
   * El balance principal solo se modifica si se especifica explícitamente (rebalanceo manual)
   */
  const updateWallet = async (
    id: string,
    { name, balance, currency, icon, color, is_archived }: UpdateWalletParams
  ): Promise<void> => {
    const result = await getWalletById(id);
    if (!result) return;

    // Verificamos que exista la wallet antes de continuar

    let updateParts = [];
    const params: any[] = [];

    if (name !== undefined) {
      updateParts.push("name = ?");
      params.push(name);
    }

    // Solo actualizar el balance cuando se proporciona explícitamente (rebalanceo manual)
    if (balance !== undefined) {
      updateParts.push("balance = ?");
      params.push(balance);
    }

    if (currency !== undefined) {
      updateParts.push("currency = ?");
      params.push(currency);
    }

    if (icon !== undefined) {
      updateParts.push("icon = ?");
      params.push(icon);
    }

    if (color !== undefined) {
      updateParts.push("color = ?");
      params.push(color);
    }

    if (is_archived !== undefined) {
      updateParts.push("is_archived = ?");
      params.push(is_archived);
    }

    // Siempre actualizamos la fecha de modificación
    updateParts.push("updated_at = ?");
    params.push(Date.now());

    // Construir la consulta
    let query = "UPDATE wallets SET ";

    // Añadir la cláusula WHERE y el ID
    if (updateParts.length > 0) {
      query += updateParts.join(", ") + " WHERE id = ?";
      params.push(id);

      // Ejecutar la consulta
      await db.runAsync(query, params);
    }
  };

  /**
   * Elimina una billetera por su ID
   */
  const deleteWallet = async (id: string): Promise<void> => {
    await db.runAsync("DELETE FROM wallets WHERE id = ?", [id]);
  };

  // ===== CATEGORIES =====

  /**
   * Obtiene todas las categorías
   */
  const getCategories = async (type?: string): Promise<Category[]> => {
    if (type) {
      return await db.getAllAsync<Category>(
        "SELECT * FROM categories WHERE type = ? ORDER BY name ASC",
        [type]
      );
    }
    return await db.getAllAsync<Category>(
      "SELECT * FROM categories ORDER BY name ASC"
    );
  };

  /**
   * Obtiene una categoría por su ID
   */
  const getCategoryById = async (id: string): Promise<Category | null> => {
    return await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
  };

  /**
   * Crea una nueva categoría
   */
  const createCategory = async ({
    name,
    is_income,
    icon,
    color,
  }: CreateCategoryParams): Promise<string> => {
    const id = uuid.v4();
    await db.runAsync(
      "INSERT INTO categories (id, name, is_income, icon, color) VALUES (?, ?, ?, ?, ?)",
      [id, name, is_income, icon || null, color || null]
    );
    return id;
  };

  /**
   * Actualiza una categoría existente
   */
  const updateCategory = async (
    id: string,
    { name, is_income, icon, color }: UpdateCategoryParams
  ): Promise<void> => {
    let query = "UPDATE categories SET ";
    const params: any[] = [];
    const updateParts: string[] = [];

    if (name !== undefined) {
      updateParts.push("name = ?");
      params.push(name);
    }
    if (is_income !== undefined) {
      updateParts.push("is_income = ?");
      params.push(is_income);
    }
    if (icon !== undefined) {
      updateParts.push("icon = ?");
      params.push(icon);
    }
    if (color !== undefined) {
      updateParts.push("color = ?");
      params.push(color);
    }

    query += updateParts.join(", ") + " WHERE id = ?";
    params.push(id);

    if (updateParts.length > 0) {
      await db.runAsync(query, params);
    }
  };

  /**
   * Elimina una categoría por su ID
   */
  const deleteCategory = async (id: string): Promise<void> => {
    await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
  };

  // ===== TRANSACTIONS =====

  /**
   * Obtiene todas las transacciones con información relacionada
   * Opcionalmente filtradas por fecha, categoría o billetera
   */
  const getTransactions = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    walletId?: string;
    type?: string;
  }): Promise<Transaction[]> => {
    let query = `
      SELECT 
        t.*,
        c.name as category_name, 
        c.icon as category_icon, 
        c.color as category_color,
        w.name as wallet_name,
        w.icon as wallet_icon,
        w.color as wallet_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.startDate) {
      query += " AND t.timestamp >= ?";
      params.push(filters.startDate.getTime());
    }

    if (filters?.endDate) {
      query += " AND t.timestamp <= ?";
      params.push(filters.endDate.getTime());
    }

    if (filters?.categoryId) {
      query += " AND t.category_id = ?";
      params.push(filters.categoryId);
    }

    if (filters?.walletId) {
      query += " AND t.wallet_id = ?";
      params.push(filters.walletId);
    }

    if (filters?.type) {
      query += " AND t.type = ?";
      params.push(filters.type);
    }

    query += " ORDER BY t.timestamp DESC";

    return await db.getAllAsync<Transaction>(query, params);
  };

  /**
   * Obtiene una transacción por su ID con información relacionada
   */
  const getTransactionById = async (
    id: string
  ): Promise<Transaction | null> => {
    const query = `
      SELECT 
        t.*,
        c.name as category_name, 
        c.icon as category_icon, 
        c.color as category_color,
        w.name as wallet_name,
        w.icon as wallet_icon,
        w.color as wallet_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.id = ?
    `;

    return await db.getFirstAsync<Transaction>(query, [id]);
  };

  /**
   * Crea una nueva transacción sin actualizar el balance principal de la billetera
   */
  const createTransaction = async ({
    wallet_id,
    amount,
    type,
    title,
    note,
    timestamp = Date.now(),
    category_id,
    to_wallet_id,
    is_subscription = 0,
    subscription_frequency,
    next_payment_date,
    end_date,
    is_excluded = 0,
  }: CreateTransactionParams): Promise<string> => {
    const id = uuid.v4();

    try {
      // Insertamos la transacción sin modificar el balance de la wallet
      await db.runAsync(
        "INSERT INTO transactions (id, wallet_id, amount, type, title, note, timestamp, category_id, to_wallet_id, is_subscription, subscription_frequency, next_payment_date, end_date, is_excluded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          wallet_id,
          amount,
          type,
          title,
          note || null,
          timestamp,
          category_id || null,
          to_wallet_id || null,
          is_subscription,
          subscription_frequency || null,
          next_payment_date || null,
          end_date || null,
          is_excluded,
        ]
      );

      return id;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  };

  /**
   * Actualiza una transacción existente sin modificar el balance principal de la billetera
   */
  const updateTransaction = async (
    id: string,
    updates: UpdateTransactionParams
  ): Promise<void> => {
    // Obtenemos la transacción original para comparar los cambios
    const originalTransaction = await getTransactionById(id);
    if (!originalTransaction) return;

    // Casting para asegurar que TypeScript reconoce los campos correctamente
    const transaction = originalTransaction as Transaction;

    const {
      amount = transaction.amount,
      type = transaction.type,
      title = transaction.title,
      note = transaction.note,
      category_id = transaction.category_id,
      wallet_id = transaction.wallet_id,
      timestamp = transaction.timestamp,
      to_wallet_id = transaction.to_wallet_id,
      is_subscription = transaction.is_subscription,
      subscription_frequency = transaction.subscription_frequency,
      end_date = transaction.end_date,
      next_payment_date = transaction.next_payment_date,
      is_excluded = transaction.is_excluded,
    } = updates;

    // Actualizar la transacción sin modificar los balances de las wallets
    await db.runAsync(
      "UPDATE transactions SET amount = ?, type = ?, title = ?, note = ?, category_id = ?, wallet_id = ?, timestamp = ?, to_wallet_id = ?, is_subscription = ?, subscription_frequency = ?, end_date = ?, next_payment_date = ?, is_excluded = ? WHERE id = ?",
      [
        amount,
        type,
        title,
        note || null,
        category_id || null,
        wallet_id || null,
        timestamp || null,
        to_wallet_id || null,
        is_subscription,
        subscription_frequency || null,
        end_date || null,
        next_payment_date || null,
        is_excluded !== undefined ? is_excluded : transaction.is_excluded,
        id,
      ]
    );
  };

  /**
   * Elimina una transacción sin modificar el balance principal de la billetera
   */
  const deleteTransaction = async (id: string) => {
    // Simplemente eliminamos la transacción sin ajustar el balance de la wallet
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  };

  // ===== BUDGETS =====

  /**
   * Obtiene todos los presupuestos
   */
  const getBudgets = async (): Promise<Budget[]> => {
    return await db.getAllAsync<Budget>(`
      SELECT 
        b.*,
        (
          SELECT COALESCE(SUM(t.amount), 0)
          FROM transactions t
          WHERE t.category_id IN (
            SELECT category_id 
            FROM category_budget_limits 
            WHERE budget_id = b.id
          )
          AND t.type = 'expense'
          AND t.date >= b.start_date
          AND t.date <= b.end_date
        ) as spent_amount
      FROM budgets b
      ORDER BY b.end_date DESC
    `);
  };

  /**
   * Obtiene un presupuesto por su ID con límites por categoría
   */
  const getBudgetById = async (id: string): Promise<Budget | null> => {
    const budget = await db.getFirstAsync<Budget>(
      `
      SELECT 
        b.*,
        (
          SELECT COALESCE(SUM(t.amount), 0)
          FROM transactions t
          WHERE t.category_id IN (
            SELECT category_id 
            FROM category_budget_limits 
            WHERE budget_id = b.id
          )
          AND t.type = 'expense'
          AND t.date >= b.start_date
          AND t.date <= b.end_date
        ) as spent_amount
      FROM budgets b
      WHERE b.id = ?
    `,
      [id]
    );

    if (budget) {
      // Obtenemos los límites por categoría
      budget.limits = await db.getAllAsync<CategoryBudgetLimit>(
        `
        SELECT 
          cbl.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          (
            SELECT COALESCE(SUM(t.amount), 0)
            FROM transactions t
            WHERE t.category_id = cbl.category_id
            AND t.type = 'expense'
            AND strftime('%Y', datetime(t.timestamp/1000, 'unixepoch')) = ?
            AND strftime('%m', datetime(t.timestamp/1000, 'unixepoch')) = ?
          ) as spent_amount
        FROM category_budget_limits cbl
        JOIN categories c ON cbl.category_id = c.id
        WHERE cbl.budget_id = ?
      `,
        [budget.year.toString(), budget.month.toString().padStart(2, "0"), id]
      );
    }

    return budget;
  };

  /**
   * Crea un nuevo presupuesto con límites por categoría
   */
  const createBudget = async ({
    amount,
    month,
    year,
    limits = [],
  }: CreateBudgetParams): Promise<string> => {
    const id = uuid.v4();

    // Utilizamos una transacción SQL para garantizar la consistencia de los datos
    await db.withTransactionAsync(async () => {
      // Insertamos el presupuesto
      await db.runAsync(
        "INSERT INTO budgets (id, amount, month, year) VALUES (?, ?, ?, ?)",
        [id, amount, month, year]
      );

      // Insertamos los límites por categoría
      for (const limit of limits) {
        await db.runAsync(
          "INSERT INTO category_budget_limits (budget_id, category_id, amount) VALUES (?, ?, ?)",
          [id, limit.category_id, limit.amount]
        );
      }
    });

    return id;
  };

  /**
   * Actualiza un presupuesto existente y sus límites por categoría
   */
  const updateBudget = async (
    id: string,
    updates: UpdateBudgetParams = {}
  ): Promise<void> => {
    const result = await getBudgetById(id);
    if (!result) return;

    // Casting para asegurar que TypeScript reconoce los campos correctamente
    const budget = result as Budget;

    const {
      amount = budget.amount,
      month = budget.month,
      year = budget.year,
      limits,
    } = updates;

    // Utilizamos una transacción SQL para garantizar la consistencia de los datos
    await db.withTransactionAsync(async () => {
      // Actualizamos el presupuesto
      await db.runAsync(
        "UPDATE budgets SET amount = ?, month = ?, year = ? WHERE id = ?",
        [amount, month, year, id]
      );

      // Si hay límites, actualizamos los límites por categoría
      if (limits) {
        // Eliminamos los límites actuales
        await db.runAsync(
          "DELETE FROM category_budget_limits WHERE budget_id = ?",
          [id]
        );

        // Insertamos los nuevos límites
        for (const limit of limits) {
          await db.runAsync(
            "INSERT INTO category_budget_limits (budget_id, category_id, amount) VALUES (?, ?, ?)",
            [id, limit.category_id, limit.amount]
          );
        }
      }
    });
  };

  /**
   * Elimina un presupuesto y sus límites por categoría
   */
  const deleteBudget = async (id: string): Promise<void> => {
    // Utilizamos una transacción SQL para garantizar la consistencia de los datos
    await db.withTransactionAsync(async () => {
      // Eliminamos los límites por categoría
      await db.runAsync(
        "DELETE FROM category_budget_limits WHERE budget_id = ?",
        [id]
      );

      // Eliminamos el presupuesto
      await db.runAsync("DELETE FROM budgets WHERE id = ?", [id]);
    });
  };

  // ===== OBJETIVOS =====

  /**
   * Obtiene todos los objetivos
   */
  const getObjectives = async (): Promise<Objective[]> => {
    return await db.getAllAsync<Objective>(
      "SELECT * FROM objectives ORDER BY due_date ASC"
    );
  };

  /**
   * Obtiene un objetivo por su ID
   */
  const getObjectiveById = async (id: string): Promise<Objective | null> => {
    return await db.getFirstAsync<Objective>(
      "SELECT * FROM objectives WHERE id = ?",
      [id]
    );
  };

  /**
   * Crea un nuevo objetivo
   */
  const createObjective = async ({
    title,
    amount,
    current_amount = 0,
    type,
    due_date,
  }: CreateObjectiveParams): Promise<string> => {
    const id = uuid.v4();

    await db.runAsync(
      "INSERT INTO objectives (id, title, amount, current_amount, type, due_date) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, amount, current_amount, type, due_date || null]
    );

    return id;
  };

  /**
   * Actualiza un objetivo existente
   */
  const updateObjective = async (
    id: string,
    updates: UpdateObjectiveParams = {}
  ): Promise<void> => {
    const result = await getObjectiveById(id);
    if (!result) return;

    // Casting para asegurar que TypeScript reconoce los campos correctamente
    const objective = result as Objective;

    const {
      title = objective.title,
      amount = objective.amount,
      current_amount = objective.current_amount,
      type = objective.type,
      due_date = objective.due_date,
    } = updates;

    await db.runAsync(
      "UPDATE objectives SET title = ?, amount = ?, current_amount = ?, type = ?, due_date = ? WHERE id = ?",
      [title, amount, current_amount, type, due_date || null, id]
    );
  };

  /**
   * Elimina un objetivo por su ID
   */
  const deleteObjective = async (id: string): Promise<void> => {
    await db.runAsync("DELETE FROM objectives WHERE id = ?", [id]);
  };

  // Retorna todos los servicios de la base de datos
  return {
    // Wallets
    getWallets,
    getWalletById,
    calculateWalletBalance,
    createWallet,
    updateWallet,
    deleteWallet,

    // Categories
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,

    // Transactions
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Budgets
    getBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,

    // Objectives
    getObjectives,
    getObjectiveById,
    createObjective,
    updateObjective,
    deleteObjective,
  };
}
