import { useAddTransaction } from "@/hooks/useAddTransaction";
import React, { useState, useRef } from "react";
import AmountSheet from "./AmountSheet";
import CategorySheet from "./CategorySheet";
import DescriptionSheet from "./DescriptionSheet";

// Importamos el tipo desde el contexto
import { Category } from "@/contexts/CategoriesContext";
import type { TransactionData } from "../../../contexts/AddTransactionContext";

interface TransactionFlowProps {
  onComplete: (data: TransactionData) => void;
  onCancel: () => void;
  visible: boolean;
}

export default function TransactionFlow({
  onComplete,
  onCancel,
  visible,
}: TransactionFlowProps) {
  // Usar el step local para la navegación
  const [step, setStep] = useState<"description" | "category" | "amount">(
    "description"
  );

  // Refs para almacenar valores del flujo sin causar re-renders
  const titleRef = useRef<string>("");

  // Usar el contexto compartido para los datos
  // NOTA: No desestructuramos title/note aquí para evitar re-renders
  // innecesarios cuando el usuario escribe en el input
  const {
    setTitle,
    note,
    category,
    setCategory,
    type,
    setType,
    amount,
    setAmount,
    selectedWallet,
  } = useAddTransaction();

  // Handle description submission
  const handleDescriptionNext = (description: string) => {
    titleRef.current = description;
    setTitle(description);
    setStep("category");
  };

  // Handle category selection
  const handleCategorySelected = (
    category: Category,
    type: "expense" | "income"
  ) => {
    setCategory(category);
    setType(type);
    setStep("amount");
  };

  // Handle amount submission
  const handleAmountComplete = (amount: string) => {
    setAmount(amount);
    onComplete({
      title: titleRef.current,
      note,
      category,
      type,
      amount,
      wallet_id: selectedWallet?.id || "",
    });
  };

  // Handle closing any sheet
  const handleClose = () => {
    onCancel();
  };

  switch (step) {
    case "description":
      return (
        <DescriptionSheet
          visible={visible && step === "description"}
          onNext={handleDescriptionNext}
          onClose={handleClose}
        />
      );
    case "category":
      return (
        <CategorySheet
          visible={visible && step === "category"}
          onSelectCategory={handleCategorySelected}
          onClose={handleClose}
        />
      );
    case "amount":
      return (
        <AmountSheet
          visible={visible && step === "amount"}
          category={category}
          transactionType={type}
          onComplete={handleAmountComplete}
          onClose={handleClose}
          amount={amount}
          setAmount={setAmount}
        />
      );
    default:
      return null;
  }
}
