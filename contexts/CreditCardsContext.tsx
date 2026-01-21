import { useWallets } from "./WalletsContext";
import { Wallet } from "@/lib/database/sqliteService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// DEPRECATED: Credit cards are now wallets with type='credit'
// This context wraps WalletsContext for backward compatibility

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
const getNextCutOffDate = (cutOffDay: number | undefined): Date => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const day = cutOffDay || 1;

  let nextCutOff = new Date(currentYear, currentMonth, day);
  if (nextCutOff <= today) {
    nextCutOff = new Date(currentYear, currentMonth + 1, day);
  }
  return nextCutOff;
};

// Función para calcular la próxima fecha de pago basada en la fecha de corte
const getNextPaymentDate = (
  paymentDueDay: number | undefined,
  cutOffDay: number | undefined,
  nextCutOffDate: Date
): Date => {
  const payDay = paymentDueDay || 15;
  const cutDay = cutOffDay || 1;

  // Obtener el mes y año de la fecha de corte calculada
  const cutOffMonth = nextCutOffDate.getMonth();
  const cutOffYear = nextCutOffDate.getFullYear();

  // Si el día de pago es mayor que el día de corte, el pago es en el mismo mes
  // Si el día de pago es menor o igual que el día de corte, el pago es en el mes siguiente
  if (payDay > cutDay) {
    // Pago en el mismo mes que el corte (ej: corte 13, pago 23)
    return new Date(cutOffYear, cutOffMonth, payDay);
  } else {
    // Pago en el mes siguiente al corte (ej: corte 25, pago 5)
    return new Date(cutOffYear, cutOffMonth + 1, payDay);
  }
};

// Convertir Wallet (type='credit') a CreditCard
const walletToCreditCard = (wallet: Wallet): CreditCard => {
  // Usar net_balance (calculado desde transacciones) para obtener la deuda actual
  const currentDebt = wallet.net_balance !== undefined ? wallet.net_balance : wallet.balance;
  const available_credit = Math.max(0, (wallet.credit_limit || 0) - currentDebt);
  const utilization_percentage = (wallet.credit_limit || 0) > 0
    ? (currentDebt / (wallet.credit_limit || 1)) * 100
    : 0;

  const next_cut_off_date = getNextCutOffDate(wallet.cut_off_day);
  const next_payment_date = getNextPaymentDate(
    wallet.payment_due_day,
    wallet.cut_off_day,
    next_cut_off_date
  );

  const today = new Date();
  const days_until_payment = Math.ceil(
    (next_payment_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: wallet.id,
    name: wallet.name,
    bank: wallet.bank || null,
    last_four_digits: wallet.last_four_digits || null,
    credit_limit: wallet.credit_limit || 0,
    current_balance: currentDebt,
    cut_off_day: wallet.cut_off_day || 1,
    payment_due_day: wallet.payment_due_day || 15,
    interest_rate: wallet.interest_rate || 0,
    color: wallet.color || null,
    icon: wallet.icon || null,
    is_archived: wallet.is_archived || 0,
    created_at: wallet.created_at || 0,
    updated_at: wallet.updated_at || 0,
    available_credit,
    utilization_percentage,
    next_cut_off_date,
    next_payment_date,
    days_until_payment,
  };
};

export const CreditCardsProvider: React.FC<CreditCardsProviderProps> = ({ children }) => {
  const { wallets, isLoading, refreshWallets, createWallet, updateWallet, deleteWallet } = useWallets();
  const [error, setError] = useState<string | null>(null);

  // Filtrar solo wallets de tipo 'credit'
  const creditCards: CreditCard[] = wallets
    .filter(w => w.type === 'credit' && !w.is_archived)
    .map(walletToCreditCard);

  const refreshCreditCards = useCallback(async () => {
    try {
      setError(null);
      await refreshWallets();
    } catch (err) {
      console.error("Error refreshing credit cards:", err);
      setError("Error al cargar las tarjetas de crédito");
    }
  }, [refreshWallets]);

  const createCreditCard = useCallback(
    async (params: CreateCreditCardParams) => {
      try {
        setError(null);
        const id = await createWallet({
          name: params.name,
          balance: params.current_balance || 0,
          currency: "MXN",
          icon: params.icon || "💳",
          color: params.color || "#1E3A8A",
          type: "credit",
          bank: params.bank,
          last_four_digits: params.last_four_digits,
          credit_limit: params.credit_limit,
          cut_off_day: params.cut_off_day,
          payment_due_day: params.payment_due_day,
          interest_rate: params.interest_rate,
        });
        return id;
      } catch (err) {
        console.error("Error creating credit card:", err);
        setError("Error al crear la tarjeta de crédito");
        throw err;
      }
    },
    [createWallet]
  );

  const updateCreditCard = useCallback(
    async (id: string, params: UpdateCreditCardParams) => {
      try {
        setError(null);
        await updateWallet(id, {
          name: params.name,
          balance: params.current_balance,
          icon: params.icon,
          color: params.color,
          bank: params.bank,
          last_four_digits: params.last_four_digits,
          credit_limit: params.credit_limit,
          cut_off_day: params.cut_off_day,
          payment_due_day: params.payment_due_day,
          interest_rate: params.interest_rate,
        });
      } catch (err) {
        console.error("Error updating credit card:", err);
        setError("Error al actualizar la tarjeta de crédito");
        throw err;
      }
    },
    [updateWallet]
  );

  const deleteCreditCard = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await deleteWallet(id);
      } catch (err) {
        console.error("Error deleting credit card:", err);
        setError("Error al eliminar la tarjeta de crédito");
        throw err;
      }
    },
    [deleteWallet]
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
