import { useSQLiteContext } from "expo-sqlite";
import uuid from "react-native-uuid";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CreditCard {
  id: string;
  name: string;
  bank: string | null;
  last_four_digits: string | null;
  credit_limit: number;
  current_balance: number;
  cut_off_day: number;
  payment_due_day: number;
  interest_rate: number;
  color: string | null;
  icon: string | null;
  is_archived: number;
  created_at: number;
  updated_at: number;
  // Campos calculados
  available_credit?: number;
  utilization_percentage?: number;
  next_cut_off_date?: Date;
  next_payment_date?: Date;
  days_until_payment?: number;
}

interface CreateCreditCardParams {
  name: string;
  bank?: string;
  last_four_digits?: string;
  credit_limit: number;
  current_balance?: number;
  cut_off_day: number;
  payment_due_day: number;
  interest_rate?: number;
  color?: string;
  icon?: string;
}

interface UpdateCreditCardParams {
  name?: string;
  bank?: string;
  last_four_digits?: string;
  credit_limit?: number;
  current_balance?: number;
  cut_off_day?: number;
  payment_due_day?: number;
  interest_rate?: number;
  color?: string;
  icon?: string;
}

interface CreditCardsContextType {
  creditCards: CreditCard[];
  isLoading: boolean;
  error: string | null;
  totalCreditLimit: number;
  totalBalance: number;
  totalAvailableCredit: number;
  refreshCreditCards: () => Promise<void>;
  createCreditCard: (params: CreateCreditCardParams) => Promise<string>;
  updateCreditCard: (id: string, params: UpdateCreditCardParams) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addPayment: (id: string, amount: number) => Promise<void>;
  addCharge: (id: string, amount: number) => Promise<void>;
  getCreditCardById: (id: string) => CreditCard | undefined;
}

const CreditCardsContext = createContext<CreditCardsContextType | undefined>(undefined);

export const useCreditCards = () => {
  const context = useContext(CreditCardsContext);
  if (context === undefined) {
    throw new Error("useCreditCards must be used within a CreditCardsProvider");
  }
  return context;
};

interface CreditCardsProviderProps {
  children: React.ReactNode;
}

// Función para calcular la próxima fecha de corte
const getNextCutOffDate = (cutOffDay: number): Date => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextCutOff = new Date(currentYear, currentMonth, cutOffDay);
  if (nextCutOff <= today) {
    nextCutOff = new Date(currentYear, currentMonth + 1, cutOffDay);
  }
  return nextCutOff;
};

// Función para calcular la próxima fecha de pago
const getNextPaymentDate = (paymentDueDay: number): Date => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextPayment = new Date(currentYear, currentMonth, paymentDueDay);
  if (nextPayment <= today) {
    nextPayment = new Date(currentYear, currentMonth + 1, paymentDueDay);
  }
  return nextPayment;
};

// Función para enriquecer tarjeta con campos calculados
const enrichCreditCard = (card: CreditCard): CreditCard => {
  const available_credit = Math.max(0, card.credit_limit - card.current_balance);
  const utilization_percentage = card.credit_limit > 0
    ? (card.current_balance / card.credit_limit) * 100
    : 0;
  const next_cut_off_date = getNextCutOffDate(card.cut_off_day);
  const next_payment_date = getNextPaymentDate(card.payment_due_day);

  const today = new Date();
  const days_until_payment = Math.ceil(
    (next_payment_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...card,
    available_credit,
    utilization_percentage,
    next_cut_off_date,
    next_payment_date,
    days_until_payment,
  };
};

export const CreditCardsProvider: React.FC<CreditCardsProviderProps> = ({ children }) => {
  const db = useSQLiteContext();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCreditCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cards = await db.getAllAsync<CreditCard>(
        "SELECT * FROM credit_cards WHERE is_archived = 0 ORDER BY name ASC"
      );

      const enrichedCards = cards.map(enrichCreditCard);
      setCreditCards(enrichedCards);
    } catch (err) {
      console.error("Error loading credit cards:", err);
      setError("Error al cargar las tarjetas de crédito");
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const createCreditCard = useCallback(
    async (params: CreateCreditCardParams) => {
      try {
        setError(null);
        const id = uuid.v4() as string;

        await db.runAsync(
          `INSERT INTO credit_cards (id, name, bank, last_four_digits, credit_limit, current_balance, cut_off_day, payment_due_day, interest_rate, color, icon)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            params.name,
            params.bank || null,
            params.last_four_digits || null,
            params.credit_limit,
            params.current_balance || 0,
            params.cut_off_day,
            params.payment_due_day,
            params.interest_rate || 0,
            params.color || "#1E3A8A",
            params.icon || "💳",
          ]
        );

        await refreshCreditCards();
        return id;
      } catch (err) {
        console.error("Error creating credit card:", err);
        setError("Error al crear la tarjeta de crédito");
        throw err;
      }
    },
    [db, refreshCreditCards]
  );

  const updateCreditCard = useCallback(
    async (id: string, params: UpdateCreditCardParams) => {
      try {
        setError(null);
        const updates: string[] = [];
        const values: any[] = [];

        if (params.name !== undefined) {
          updates.push("name = ?");
          values.push(params.name);
        }
        if (params.bank !== undefined) {
          updates.push("bank = ?");
          values.push(params.bank);
        }
        if (params.last_four_digits !== undefined) {
          updates.push("last_four_digits = ?");
          values.push(params.last_four_digits);
        }
        if (params.credit_limit !== undefined) {
          updates.push("credit_limit = ?");
          values.push(params.credit_limit);
        }
        if (params.current_balance !== undefined) {
          updates.push("current_balance = ?");
          values.push(params.current_balance);
        }
        if (params.cut_off_day !== undefined) {
          updates.push("cut_off_day = ?");
          values.push(params.cut_off_day);
        }
        if (params.payment_due_day !== undefined) {
          updates.push("payment_due_day = ?");
          values.push(params.payment_due_day);
        }
        if (params.interest_rate !== undefined) {
          updates.push("interest_rate = ?");
          values.push(params.interest_rate);
        }
        if (params.color !== undefined) {
          updates.push("color = ?");
          values.push(params.color);
        }
        if (params.icon !== undefined) {
          updates.push("icon = ?");
          values.push(params.icon);
        }

        updates.push("updated_at = ?");
        values.push(Date.now());
        values.push(id);

        if (updates.length > 1) {
          await db.runAsync(
            `UPDATE credit_cards SET ${updates.join(", ")} WHERE id = ?`,
            values
          );
          await refreshCreditCards();
        }
      } catch (err) {
        console.error("Error updating credit card:", err);
        setError("Error al actualizar la tarjeta de crédito");
        throw err;
      }
    },
    [db, refreshCreditCards]
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await db.runAsync("DELETE FROM credit_cards WHERE id = ?", [id]);
        await refreshCreditCards();
      } catch (err) {
        console.error("Error deleting credit card:", err);
        setError("Error al eliminar la tarjeta de crédito");
        throw err;
      }
    },
    [db, refreshCreditCards]
  );

  const addPayment = useCallback(
    async (id: string, amount: number) => {
      try {
        const card = creditCards.find(c => c.id === id);
        if (!card) throw new Error("Tarjeta no encontrada");

        const newBalance = Math.max(0, card.current_balance - amount);
        await updateCreditCard(id, { current_balance: newBalance });
      } catch (err) {
        console.error("Error adding payment:", err);
        throw err;
      }
    },
    [creditCards, updateCreditCard]
  );

  const addCharge = useCallback(
    async (id: string, amount: number) => {
      try {
        const card = creditCards.find(c => c.id === id);
        if (!card) throw new Error("Tarjeta no encontrada");

        const newBalance = card.current_balance + amount;
        await updateCreditCard(id, { current_balance: newBalance });
      } catch (err) {
        console.error("Error adding charge:", err);
        throw err;
      }
    },
    [creditCards, updateCreditCard]
  );

  const getCreditCardById = useCallback(
    (id: string): CreditCard | undefined => {
      return creditCards.find(card => card.id === id);
    },
    [creditCards]
  );

  useEffect(() => {
    refreshCreditCards();
  }, [refreshCreditCards]);

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const totalBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalAvailableCredit = creditCards.reduce((sum, card) => sum + (card.available_credit || 0), 0);

  const value: CreditCardsContextType = {
    creditCards,
    isLoading,
    error,
    totalCreditLimit,
    totalBalance,
    totalAvailableCredit,
    refreshCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addPayment,
    addCharge,
    getCreditCardById,
  };

  return (
    <CreditCardsContext.Provider value={value}>
      {children}
    </CreditCardsContext.Provider>
  );
};
