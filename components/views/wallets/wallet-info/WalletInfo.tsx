import { useTheme } from "@/theme/ThemeProvider";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Wallet, useSQLiteService } from "@/lib/database/sqliteService";
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

export default function WalletInfo({ wallet }: WalletInfoProps) {
  const { theme, accent } = useTheme();
  const { getTransactions } = useSQLiteService();
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"income" | "expenses">("expenses");

  const loadStats = useCallback(async (walletId: string) => {
    try {
      setIsLoading(true);
      const all = await getTransactions({ walletId });
      const included = all.filter((t: Transaction) => t.is_excluded === 0);
      const income = included.filter((t: Transaction) => t.type === "income");
      const expenses = included.filter((t: Transaction) => t.type === "expense");
      const totalIncome = income.reduce((s: number, t: Transaction) => s + t.amount, 0);
      const totalExpenses = expenses.reduce((s: number, t: Transaction) => s + t.amount, 0);
      setStats({
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: included.length,
        incomeTransactions: income,
        expenseTransactions: expenses,
        categoryStats: {},
      });
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (wallet?.id) loadStats(wallet.id);
  }, [wallet?.id, loadStats]);

  const current = selectedTab === "income"
    ? stats?.incomeTransactions || []
    : stats?.expenseTransactions || [];

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <WalletInfoHeader wallet={wallet} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.loadingText, { color: theme.textSec }]}>Cargando estadísticas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <WalletInfoHeader wallet={wallet} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {stats && (
          <>
            <WalletStatsSummary
              stats={stats}
              currency={wallet.currency}
              currentBalance={wallet.balance + stats.netBalance}
            />

            <View style={[styles.sectionHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Movimientos</Text>
            </View>

            <TransactionTabs
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              incomeCount={stats.incomeTransactions.length}
              expenseCount={stats.expenseTransactions.length}
            />

            <CategoryStats
              transactions={current}
              totalAmount={selectedTab === "income" ? stats.totalIncome : stats.totalExpenses}
              currency={wallet.currency}
            />

            <TransactionList transactions={current} currency={wallet.currency} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { fontSize: 15 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.4 },
});
