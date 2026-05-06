import { Category } from "@/contexts/CategoriesContext";
import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useInvestments } from "./InvestmentsContext";
import { useObjectives } from "./ObjectivesContext";
import { useSubscriptions } from "./SubscriptionsContext";
import { useTransactions } from "./TransactionsContext";
import { useWallets } from "./WalletsContext";

export interface TransactionData {
  title: string;
  note?: string;
  category: Category | null;
  type: "expense" | "income";
  amount: string;
  wallet_id: string;
}

interface AddTransactionContextType {
  title: string;
  setTitle: (title: string) => void;
  note: string;
  setNote: (note: string) => void;
  category: Category | null;
  setCategory: (category: Category | null) => void;
  type: "expense" | "income";
  setType: (type: "expense" | "income") => void;
  amount: string;
  setAmount: (amount: string) => void;
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  setSelectedWallet: (wallet: Wallet | null) => void;
  objective_id?: string;
  setObjectiveId: (id?: string) => void;
  isLoading: boolean;
  isCreating: boolean;
  createTransaction: (
    timestamp?: number,
    overrides?: {
      amount?: string;
      wallet?: Wallet | null;
      category?: Category | null;
      note?: string;
      title?: string;
      type?: "expense" | "income";
    }
  ) => Promise<boolean>;
  resetTransaction: () => void;
  error: string | null;
  clearError: () => void;
}

const defaultContextValue: AddTransactionContextType = {
  title: "",
  setTitle: () => {},
  note: "",
  setNote: () => {},
  category: null,
  setCategory: () => {},
  type: "expense",
  setType: () => {},
  amount: "0",
  setAmount: () => {},
  wallets: [],
  selectedWallet: null,
  setSelectedWallet: () => {},
  objective_id: undefined,
  setObjectiveId: () => {},
  isLoading: false,
  isCreating: false,
  createTransaction: async () => false,
  resetTransaction: () => {},
  error: null,
  clearError: () => {},
};

const AddTransactionContext =
  createContext<AddTransactionContextType>(defaultContextValue);

export const useAddTransaction = () => useContext(AddTransactionContext);

export const AddTransactionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Estados para la transacción
  const [title, setTitle] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [category, setCategory] = useState<Category | null>(null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("0");
  const [objective_id, setObjectiveId] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const { wallets, isLoading, refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();
  const { refreshSubscriptions } = useSubscriptions();
  const { refreshInvestments } = useInvestments();
  const { createTransaction: createTransactionDB, updateWalletBalance, updateObjective, getObjectiveById, getObjectiveByCreditWallet, createObjective, getWalletById } = useSQLiteService();
  const { refreshObjectives } = useObjectives();

  const createTransaction = async (
    timestamp?: number,
    overrides?: {
      amount?: string;
      wallet?: Wallet | null;
      category?: Category | null;
      note?: string;
      title?: string;
      type?: "expense" | "income";
    }
  ): Promise<boolean> => {
    const effectiveAmount = overrides?.amount ?? amount;
    const effectiveWallet = overrides?.wallet ?? selectedWallet;
    const effectiveCategory = overrides?.category ?? category;
    const effectiveNote = overrides?.note ?? note;
    const effectiveTitle = overrides?.title ?? title;
    const effectiveType = overrides?.type ?? type;

    if (!effectiveWallet) {
      const errorMsg = "Selecciona una cuenta";
      setError(errorMsg);
      console.error(errorMsg);
      return false;
    }
    if (parseFloat(effectiveAmount) <= 0) {
      return false;
    }

    const amountNum = parseFloat(effectiveAmount);

    // Validar límites para gastos
    if (effectiveType === "expense") {
      // Para tarjetas de crédito: deben tener límite configurado
      if (effectiveWallet.type === "credit") {
        if (!effectiveWallet.credit_limit || effectiveWallet.credit_limit <= 0) {
          const errorMsg = "La tarjeta de crédito no tiene límite configurado";
          setError(errorMsg);
          console.error(errorMsg);
          return false;
        }
      }
      // Para cuentas regulares: deben tener saldo suficiente
      else {
        const availableBalance = effectiveWallet.net_balance || effectiveWallet.balance || 0;
        if (availableBalance < amountNum) {
          const errorMsg = `Saldo insuficiente. Disponible: $${availableBalance.toFixed(2)}, Necesario: $${amountNum.toFixed(2)}`;
          setError(errorMsg);
          console.error(errorMsg);
          return false;
        }
      }
    }

    const transactionTimestamp = timestamp || Date.now();

    console.log({
      wallet_id: effectiveWallet.id,
      amount: amountNum,
      type: effectiveType,
      title: effectiveTitle.trim(),
      note: effectiveNote.trim() || undefined,
      category_id: effectiveCategory?.id,
      timestamp: transactionTimestamp,
    });

    try {
      setIsCreating(true);

      // Validar que el título no esté vacío, SI ESTA VACIO TOMAR EL NOMBRE DE LA CATEGORIA
      if (!effectiveTitle.trim()) {
        await createTransactionDB({
          wallet_id: effectiveWallet.id,
          amount: amountNum,
          type: effectiveType,
          title: effectiveCategory?.name || "",
          note: effectiveNote.trim() || undefined,
          category_id: effectiveCategory?.id,
          objective_id: objective_id,
          timestamp: transactionTimestamp,
        });
      } else {
        await createTransactionDB({
          wallet_id: effectiveWallet.id,
          amount: amountNum,
          type: effectiveType,
          title: effectiveTitle.trim() || "",
          note: effectiveNote.trim() || undefined,
          category_id: effectiveCategory?.id,
          objective_id: objective_id,
          timestamp: transactionTimestamp,
        });
      }

      // Si hay un objetivo vinculado, actualizar su progreso
      if (objective_id) {
        const objective = await getObjectiveById(objective_id);
        if (objective) {
          let progressDelta = 0;

          // Para objetivos de ahorro: ingresos aumentan el progreso
          if (objective.type === "savings" && effectiveType === "income") {
            progressDelta = amountNum;
          }

          // Actualizar el progreso del objetivo
          if (progressDelta > 0) {
            await updateObjective(objective_id, {
              current_amount: objective.current_amount + progressDelta,
            });
          }
        }
      }

      // Si la transacción es en una tarjeta de crédito, crear/actualizar deuda automáticamente
      if (effectiveWallet.type === "credit") {
        // Buscar si ya existe una deuda para esta tarjeta
        let debtObjective = await getObjectiveByCreditWallet(effectiveWallet.id);

        // Obtener el wallet actualizado para obtener el balance actual (net_balance incluye todas las transacciones)
        const updatedWallet = await getWalletById(effectiveWallet.id);
        if (!updatedWallet) {
          throw new Error("Wallet not found");
        }

        // Para wallets de crédito, net_balance = deuda owed (balance inicial + gastos - ingresos)
        const debtAmount = updatedWallet.net_balance || updatedWallet.balance;

        if (debtObjective) {
          // Si ya existe objetivo de deuda, actualizar SOLO si la deuda aumentó
          // amount = deuda máxima acumulada (nunca disminuye, solo aumenta)
          // current_amount se mantiene (cuánto has pagado)
          if (debtAmount > debtObjective.amount) {
            await updateObjective(debtObjective.id, {
              amount: debtAmount,
            });
          }
        } else if (debtAmount > 0) {
          // Crear una nueva deuda si no existe y hay balance en la tarjeta
          // amount = deuda actual (lo que debes)
          // current_amount = 0 (no has pagado nada aún)
          await createObjective({
            title: `Deuda: ${effectiveWallet.name}`,
            amount: debtAmount,
            current_amount: 0,
            type: "debt",
            credit_wallet_id: effectiveWallet.id,
          });
        }
      }

      await refreshWallets();
      await refreshTransactions();
      await refreshObjectives();
      await refreshSubscriptions();
      await refreshInvestments();

      return true;
    } catch (error) {
      console.error("Error creating transaction:", error);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const resetTransaction = () => {
    setTitle("");
    setNote("");
    setCategory(null);
    setType("expense");
    setAmount("0");
    setObjectiveId(undefined);
    setError(null);
    // Mantener la wallet seleccionada para la próxima transacción
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AddTransactionContext.Provider
      value={{
        title,
        setTitle,
        note,
        setNote,
        category,
        setCategory,
        type,
        setType,
        amount,
        setAmount,
        wallets: wallets as Wallet[],
        selectedWallet,
        setSelectedWallet,
        objective_id,
        setObjectiveId,
        isLoading,
        isCreating,
        createTransaction,
        resetTransaction,
        error,
        clearError,
      }}
    >
      {children}
    </AddTransactionContext.Provider>
  );
};

export default AddTransactionContext;
