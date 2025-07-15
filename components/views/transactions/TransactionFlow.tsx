import { useAddTransaction } from "@/hooks/useAddTransaction";
import React, { useState } from "react";
import AmountSheet from "./AmountSheet";
import CategorySheet, { Category } from "./CategorySheet";
import DescriptionSheet from "./DescriptionSheet";

// Importamos el tipo desde el contexto
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

  // Usar el contexto compartido para los datos
  const {
    description, 
    setDescription, 
    category, 
    setCategory, 
    type, 
    setType, 
    amount, 
    setAmount
  } = useAddTransaction();

  // Handle description submission
  const handleDescriptionNext = (description: string) => {
    setDescription(description);
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
      description,
      category,
      type,
      amount,
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
