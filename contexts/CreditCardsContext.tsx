import { useWallets } from "./WalletsContext";
import { Wallet } from "@/lib/database/sqliteService";
import { useSQLiteService } from "@/lib/database/sqliteService";
import {
  CreditInstallment,
  CreateInstallmentParams,
  PeriodInfo,
  useCreditCardService,
} from "@/lib/database/creditCardService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// DEPRECATED: Credit cards are now wallets with type='credit'
// This context wraps WalletsContext for backward compatibility

export type { CreditInstallment };

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
  previous_balance: number;
  open_cycle_balance: number;
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
  previous_balance?: number;
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
  previous_balance?: number;
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
  installmentsByCard: Record<string, CreditInstallment[]>;
  refreshCreditCards: () => Promise<void>;
  createCreditCard: (params: CreateCreditCardParams) => Promise<string>;
  updateCreditCard: (id: string, params: UpdateCreditCardParams) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addPayment: (id: string, amount: number) => Promise<void>;
  addCharge: (id: string, amount: number) => Promise<void>;
  getCreditCardById: (id: string) => CreditCard | undefined;
  createInstallment: (params: CreateInstallmentParams) => Promise<void>;
  deleteInstallment: (id: string, walletId: string) => Promise<void>;
  markInstallmentPaid: (id: string, walletId: string) => Promise<void>;
  getPeriodInfo: (cardId: string) => Promise<PeriodInfo | null>;
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

const getNextPaymentDate = (
  paymentDueDay: number | undefined,
  cutOffDay: number | undefined,
  nextCutOffDate: Date
): Date => {
  const payDay = paymentDueDay || 15;
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const todayDay = today.getDate();

  // Si el día de pago ya pasó este mes, es el próximo mes
  // Si el día de pago aún no llega, es este mes (antes del corte)
  if (payDay > todayDay) {
    // Pago este mes (aun no pasa)
    return new Date(thisYear, thisMonth, payDay);
  } else {
    // Pago ya pasó, es el próximo mes
    return new Date(thisYear, thisMonth + 1, payDay);
  }
};

const walletToCreditCard = (wallet: Wallet): CreditCard => {
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
    previous_balance: wallet.previous_balance || 0,
    open_cycle_balance: wallet.balance || 0,
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
  const { createTransaction } = useSQLiteService();
  const creditCardService = useCreditCardService();
  const [error, setError] = useState<string | null>(null);
  const [installmentsByCard, setInstallmentsByCard] = useState<Record<string, CreditInstallment[]>>({});

  const creditCards: CreditCard[] = wallets
    .filter(w => w.type === 'credit' && !w.is_archived)
    .map(walletToCreditCard);

  const loadInstallments = useCallback(async () => {
    try {
      const all = await creditCardService.getAllInstallments();
      const byCard: Record<string, CreditInstallment[]> = {};
      for (const inst of all) {
        if (!byCard[inst.wallet_id]) byCard[inst.wallet_id] = [];
        byCard[inst.wallet_id].push(inst);
      }
      setInstallmentsByCard(byCard);
    } catch (err) {
      console.error("Error loading installments:", err);
    }
  }, [creditCardService]);

  useEffect(() => {
    loadInstallments();
  }, [loadInstallments]);

  const refreshCreditCards = useCallback(async () => {
    try {
      setError(null);
      await refreshWallets();
      await loadInstallments();
    } catch (err) {
      console.error("Error refreshing credit cards:", err);
      setError("Error al cargar las tarjetas de crédito");
    }
  }, [refreshWallets, loadInstallments]);

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
          previous_balance: params.previous_balance || 0,
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
          previous_balance: params.previous_balance,
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

  const createInstallment = useCallback(
    async (params: CreateInstallmentParams) => {
      try {
        await creditCardService.createInstallment(params);
        await loadInstallments();
      } catch (err) {
        console.error("Error creating installment:", err);
        throw err;
      }
    },
    [creditCardService, loadInstallments]
  );

  const deleteInstallment = useCallback(
    async (id: string, _walletId: string) => {
      try {
        await creditCardService.deleteInstallment(id);
        await loadInstallments();
      } catch (err) {
        console.error("Error deleting installment:", err);
        throw err;
      }
    },
    [creditCardService, loadInstallments]
  );

  const markInstallmentPaid = useCallback(
    async (id: string, walletId: string) => {
      try {
        const cardInstallments = installmentsByCard[walletId] || [];
        const installment = cardInstallments.find(i => i.id === id);
        if (!installment) throw new Error("Cuota no encontrada");
        if (installment.paid_installments >= installment.total_installments) return;

        const cuotaNum = installment.paid_installments + 1;
        await creditCardService.incrementPaidInstallments(id);
        await createTransaction({
          wallet_id: walletId,
          type: "income",
          amount: installment.monthly_amount,
          title: `Cuota ${cuotaNum}/${installment.total_installments} — ${installment.title}`,
          timestamp: Date.now(),
        });
        await refreshCreditCards();
      } catch (err) {
        console.error("Error marking installment paid:", err);
        throw err;
      }
    },
    [installmentsByCard, creditCardService, createTransaction, refreshCreditCards]
  );

  const getPeriodInfo = useCallback(
    async (cardId: string): Promise<PeriodInfo | null> => {
      try {
        const card = getCreditCardById(cardId);
        if (!card) return null;
        return await creditCardService.calculatePeriodInfo(cardId, card.cut_off_day);
      } catch (err) {
        console.error("Error getting period info:", err);
        return null;
      }
    },
    [getCreditCardById, creditCardService]
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
    installmentsByCard,
    refreshCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addPayment,
    addCharge,
    getCreditCardById,
    createInstallment,
    deleteInstallment,
    markInstallmentPaid,
    getPeriodInfo,
  };

  return (
    <CreditCardsContext.Provider value={value}>
      {children}
    </CreditCardsContext.Provider>
  );
};
