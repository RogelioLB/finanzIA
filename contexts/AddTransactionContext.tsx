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

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const { wallets, isLoading, refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();
  const { createTransaction: createTransactionDB, updateWalletBalance, updateObjective, getObjectiveById } = useSQLiteService();
  const { refreshObjectives } = useObjectives();

  const createTransaction = async (timestamp?: number): Promise<boolean> => {
    if (!selectedWallet || parseFloat(amount) <= 0) {
      return false;
    }
    
    const transactionTimestamp = timestamp || Date.now();
    
    console.log({
      wallet_id: selectedWallet.id,
      amount: parseFloat(amount),
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
          // Para objetivos de deuda: gastos aumentan el progreso
          else if (objective.type === "debt" && type === "expense") {
            progressDelta = parseFloat(amount);

            // Si la deuda está vinculada a una tarjeta de crédito, también actualizar el balance de la tarjeta
            if (objective.credit_wallet_id) {
              await updateWalletBalance(objective.credit_wallet_id, -progressDelta);
            }
          }

          // Actualizar el progreso del objetivo
          if (progressDelta > 0) {
            await updateObjective(objective_id, {
              current_amount: objective.current_amount + progressDelta,
            });
          }
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
    // Mantener la wallet seleccionada para la próxima transacción
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
      }}
    >
      {children}
    </AddTransactionContext.Provider>
  );
};

export default AddTransactionContext;
