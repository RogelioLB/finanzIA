import { useAddTransaction } from "@/hooks/useAddTransaction";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import BaseTransactionTemplate from "../../components/views/transactions/BaseTransactionTemplate";
import TransactionFlow from "../../components/views/transactions/TransactionFlow";
import { TransactionData } from "../../contexts/AddTransactionContext";

export default function AddTransactionScreen() {
  const router = useRouter();
  const {
    amount,
    setAmount,
    category,
    type,
    title,
    setTitle,
    note,
    setNote,
    setCategory,
    setType,
    selectedWallet,
    setSelectedWallet,
    wallets,
    isLoading: isLoadingWallets,
    isCreating,
    createTransaction,
    resetTransaction,
  } = useAddTransaction();

  const { expenseCategories, incomeCategories, loading: isLoadingCategories } = useCategories();
  const [flowVisible, setFlowVisible] = useState(true);
  const [timestamp, setTimestamp] = useState(Date.now());

  // Combinar todas las categorías
  const allCategories = [...expenseCategories, ...incomeCategories];

  const handleComplete = async () => {
    const success = await createTransaction(timestamp);
    if (success) {
      resetTransaction();
      setTimestamp(Date.now()); // Reset timestamp for next transaction
    }
    return success;
  };

  const handleFlowComplete = async (data: TransactionData) => {
    setFlowVisible(false);
    // Crear la transacción automáticamente después del flow
    const success = await createTransaction(timestamp);
    if (success) {
      resetTransaction();
      setTimestamp(Date.now());
      // Regresar a la pantalla anterior
      router.back();
    }
  };

  const handleFlowCancel = () => {
    setFlowVisible(false);
  };

  return (
    <View className="flex-1">
      <BaseTransactionTemplate
        mode="add"
        title={title}
        setTitle={setTitle}
        note={note}
        setNote={setNote}
        category={category}
        setCategory={setCategory}
        type={type}
        setType={setType}
        amount={amount}
        setAmount={setAmount}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
        wallets={wallets}
        categories={allCategories}
        isLoadingWallets={isLoadingWallets}
        isLoadingCategories={isLoadingCategories}
        onComplete={handleComplete}
        onCancel={resetTransaction}
        isProcessing={isCreating}
        timestamp={timestamp}
        setTimestamp={setTimestamp}
        showDateTimePicker={true}
      />

      {/* Transaction flow para entrada rápida inicial */}
      <TransactionFlow
        visible={flowVisible}
        onComplete={handleFlowComplete}
        onCancel={handleFlowCancel}
      />
    </View>
  );
}
