import { currencies, Currency } from "@/constants/currencies";
import { useTheme } from "@/theme/ThemeProvider";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Transaction } from "./types";

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
}

export default function TransactionList({ transactions, currency }: TransactionListProps) {
  const { theme } = useTheme();
  const sym = currencies.find((c: Currency) => c.code === currency)?.symbol || "$";

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textTer }]}>No hay transacciones</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
        renderItem={({ item }) => {
          const excluded = item.is_excluded === 1;
          const amountColor = excluded ? theme.textTer : item.type === "income" ? theme.good : theme.bad;
          const sign = item.type === "income" ? "+" : "−";
          return (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={[styles.title, { color: excluded ? theme.textTer : theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.note ? (
                  <Text style={[styles.note, { color: theme.textTer }]} numberOfLines={1}>
                    {item.note}
                  </Text>
                ) : null}
                <Text style={[styles.date, { color: theme.textTer }]}>{fmt(item.timestamp)}</Text>
              </View>
              <Text style={[styles.amount, { color: amountColor }]}>
                {sign}{sym}{item.amount.toFixed(2)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 24 },
  empty: { paddingVertical: 32, alignItems: "center" },
  emptyText: { fontSize: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  separator: { height: 1 },
  info: { flex: 1, marginRight: 12 },
  title: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2 },
  note: { fontSize: 12, marginTop: 1 },
  date: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "700", letterSpacing: -0.3 },
});
