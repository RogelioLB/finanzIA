import React, { createContext, ReactNode, useContext, useState } from "react";
import { Category } from "../components/views/transactions/CategorySheet";

export interface TransactionData {
  description: string;
  category: Category | null;
  type: "expense" | "income";
  amount: string;
}

interface AddTransactionContextType {
  description: string;
  setDescription: (description: string) => void;
  category: Category | null;
  setCategory: (category: Category | null) => void;
  type: "expense" | "income";
  setType: (type: "expense" | "income") => void;
  amount: string;
  setAmount: (amount: string) => void;
  resetTransaction: () => void;
}

const defaultContextValue: AddTransactionContextType = {
  description: "",
  setDescription: () => {},
  category: null,
  setCategory: () => {},
  type: "expense",
  setType: () => {},
  amount: "0",
  setAmount: () => {},
  resetTransaction: () => {},
};

const AddTransactionContext = createContext<AddTransactionContextType>(defaultContextValue);

export const useAddTransaction = () => useContext(AddTransactionContext);

export const AddTransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<Category | null>(null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("0");

  const resetTransaction = () => {
    setDescription("");
    setCategory(null);
    setType("expense");
    setAmount("0");
  };

  return (
    <AddTransactionContext.Provider
      value={{
        description,
        setDescription,
        category,
        setCategory,
        type,
        setType,
        amount,
        setAmount,
        resetTransaction,
      }}
    >
      {children}
    </AddTransactionContext.Provider>
  );
};

export default AddTransactionContext;
