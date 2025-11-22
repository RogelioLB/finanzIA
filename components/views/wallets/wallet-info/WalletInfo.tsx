import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wallet,
  useSQLiteService,
} from "../../../../lib/database/sqliteService";
import CategoryStats from "./CategoryStats";
import TransactionList from "./TransactionList";
import TransactionTabs from "./TransactionTabs";
import { Transaction, WalletStats } from "./types";
import WalletInfoHeader from "./WalletInfoHeader";
import WalletStatsSummary from "./WalletStatsSummary";

interface WalletInfoProps {
  wallet: Wallet;
  onWalletUpdate?: () => void;
}

export default function WalletInfo({
  wallet,
  onWalletUpdate,
}: WalletInfoProps) {
  const { getTransactions } = useSQLiteService();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"income" | "expenses">(
    "expenses"
  );

  const loadWalletStats = useCallback(async (walletId: string) => {
    try {
      setIsLoading(true);
      // Obtener transacciones de la wallet
      const walletTransactions = await getTransactions({ walletId });

      // Filtrar transacciones excluidas (suscripciones no pagadas)
      const includedTransactions = walletTransactions.filter(
        (t: Transaction) => t.is_excluded === 0
      );

      // Separar por tipo (solo transacciones incluidas)
      const incomeTransactions = includedTransactions.filter(
        (t: Transaction) => t.type === "income"
      );
      const expenseTransactions = includedTransactions.filter(
        (t: Transaction) => t.type === "expense"
      );

      // Calcular totales (solo transacciones incluidas)
      const totalIncome = incomeTransactions.reduce(
        (sum: number, t: Transaction) => sum + t.amount,
        0
      );
      const totalExpenses = expenseTransactions.reduce(
        (sum: number, t: Transaction) => sum + t.amount,
        0
      );

      // Guardar los datos base sin categoryStats
      setStats({
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: includedTransactions.length,
        incomeTransactions,
        expenseTransactions,
        categoryStats: {}, // Se calculará por separado
      });
    } catch (error) {
      console.error("Error loading wallet stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wallet?.id) {
      loadWalletStats(wallet.id);
    }
  }, [wallet?.id, loadWalletStats]);

  const currentTransactions =
    selectedTab === "income"
      ? stats?.incomeTransactions || []
      : stats?.expenseTransactions || [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <WalletInfoHeader wallet={wallet} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WalletInfoHeader wallet={wallet} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stats && (
          <>
            <WalletStatsSummary 
              stats={stats} 
              currency={wallet.currency}
              currentBalance={wallet.balance + stats.netBalance}
            />

            <TransactionTabs
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              incomeCount={stats.incomeTransactions.length}
              expenseCount={stats.expenseTransactions.length}
            />
            <CategoryStats
              transactions={currentTransactions}
              totalAmount={
                selectedTab === "income"
                  ? stats.totalIncome
                  : stats.totalExpenses
              }
              currency={wallet.currency}
            />

            <TransactionList
              transactions={currentTransactions}
              currency={wallet.currency}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
