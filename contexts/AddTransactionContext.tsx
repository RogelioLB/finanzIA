import { Category } from "@/contexts/CategoriesContext";
import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useObjectives } from "./ObjectivesContext";
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
  createTransaction: (timestamp?: number) => Promise<boolean>;
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
  const { createTransaction: createTransactionDB, updateWalletBalance, updateObjective, getObjectiveById, getObjectiveByCreditWallet, createObjective, getWalletById } = useSQLiteService();
  const { refreshObjectives } = useObjectives();

  const createTransaction = async (timestamp?: number): Promise<boolean> => {
    if (!selectedWallet || parseFloat(amount) <= 0) {
      return false;
    }

    const amountNum = parseFloat(amount);

    // Validar límites para gastos
    if (type === "expense") {
      // Para tarjetas de crédito: deben tener límite configurado
      if (selectedWallet.type === "credit") {
        if (!selectedWallet.credit_limit || selectedWallet.credit_limit <= 0) {
          const errorMsg = "La tarjeta de crédito no tiene límite configurado";
          setError(errorMsg);
          console.error(errorMsg);
          return false;
        }
      }
      // Para cuentas regulares: deben tener saldo suficiente
      else {
        const availableBalance = selectedWallet.net_balance || selectedWallet.balance || 0;
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
      wallet_id: selectedWallet.id,
      amount: amountNum,
      type: type,
      title: title.trim(),
      note: note.trim() || undefined,
      category_id: category?.id,
      timestamp: transactionTimestamp,
    });

    try {
      setIsCreating(true);

      // Validar que el título no esté vacío, SI ESTA VACIO TOMAR EL NOMBRE DE LA CATEGORIA
      if (!title.trim()) {
        await createTransactionDB({
          wallet_id: selectedWallet.id,
          amount: parseFloat(amount),
          type: type,
          title: category?.name || "",
          note: note.trim() || undefined,
          category_id: category?.id,
          objective_id: objective_id,
          timestamp: transactionTimestamp,
        });
      } else {
        await createTransactionDB({
          wallet_id: selectedWallet.id,
          amount: parseFloat(amount),
          type: type,
          title: title.trim() || "",
          note: note.trim() || undefined,
          category_id: category?.id,
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
          if (objective.type === "savings" && type === "income") {
            progressDelta = parseFloat(amount);
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
      if (selectedWallet.type === "credit") {
        // Buscar si ya existe una deuda para esta tarjeta
        let debtObjective = await getObjectiveByCreditWallet(selectedWallet.id);

        // Obtener el wallet actualizado para obtener el balance actual (net_balance incluye todas las transacciones)
        const updatedWallet = await getWalletById(selectedWallet.id);
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
            title: `Deuda: ${selectedWallet.name}`,
            amount: debtAmount,
            current_amount: 0,
            type: "debt",
            credit_wallet_id: selectedWallet.id,
          });
        }
      }

      // Refrescar las wallets para actualizar los balances
      await refreshWallets();

      // Refrescar las transacciones para mostrar la nueva
      await refreshTransactions();

      // Refrescar los objetivos
      await refreshObjectives();

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
