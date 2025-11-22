import { Category } from "@/contexts/CategoriesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useCategories } from "@/hooks/useCategories";
import { useSQLiteService } from "@/lib/database/sqliteService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import BaseTransactionTemplate from "../../components/views/transactions/BaseTransactionTemplate";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { wallets, isLoading: isLoadingWallets, refreshWallets } = useWallets();
  const { expenseCategories, incomeCategories, loading: isLoadingCategories } = useCategories();
  const { updateTransaction, getTransactionById } = useSQLiteService();
  const { refreshTransactions } = useTransactions();

  // Estados de la transacción
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("0");
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionId, setTransactionId] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now());

  // Combinar todas las categorías
  const allCategories = [...expenseCategories, ...incomeCategories];

  // Cargar la transacción
  useEffect(() => {
    const loadTransaction = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const transaction = await getTransactionById(id);

        if (transaction) {
          setTransactionId(transaction.id);
          setTitle(transaction.title || "");
          setNote(transaction.note || "");
          setType(transaction.type as "expense" | "income");
          setAmount(transaction.amount.toString());
          setTimestamp(transaction.timestamp || Date.now());

          // Buscar la categoría
          if (transaction.category_id) {
            const foundCategory = allCategories.find(
              (cat) => cat.id === transaction.category_id
            );
            if (foundCategory) {
              setCategory(foundCategory);
            }
          }

          // Buscar la wallet
          const foundWallet = wallets.find((w) => w.id === transaction.wallet_id);
          if (foundWallet) {
            setSelectedWallet(foundWallet);
          }
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (allCategories.length > 0 && wallets.length > 0) {
      loadTransaction();
    }
  }, [id, allCategories.length, wallets.length]);

  const handleComplete = async () => {
    if (!transactionId || !selectedWallet || !category) {
      return false;
    }

    try {
      setIsProcessing(true);

      await updateTransaction(transactionId, {
        title: title.trim() || category.name,
        note: note.trim() || undefined,
        amount: parseFloat(amount),
        type: type,
        category_id: category.id,
        wallet_id: selectedWallet.id,
        timestamp: timestamp,
      });

      // Refrescar las wallets para actualizar los balances
      await refreshWallets();
      
      // Refrescar las transacciones para actualizar la lista
      await refreshTransactions();

      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7952FC" />
        <Text className="text-gray-600 mt-4">Cargando transacción...</Text>
      </View>
    );
  }

  return (
    <BaseTransactionTemplate
      mode="edit"
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
      onCancel={handleCancel}
      isProcessing={isProcessing}
      timestamp={timestamp}
      setTimestamp={setTimestamp}
      showDateTimePicker={true}
    />
  );
}
