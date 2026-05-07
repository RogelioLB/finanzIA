import { currencies, Currency } from "@/constants/currencies";
import { useTheme } from "@/theme/ThemeProvider";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { WalletStats } from "./types";

interface WalletStatsSummaryProps {
  stats: WalletStats;
  currency: string;
  currentBalance: number;
}

export default function WalletStatsSummary({ stats, currency, currentBalance }: WalletStatsSummaryProps) {
  const { theme, accent } = useTheme();

  const sym = currencies.find((c: Currency) => c.code === currency)?.symbol || "$";

  const balanceHistory = useMemo(() => {
    const allTransactions = [
      ...stats.incomeTransactions,
      ...stats.expenseTransactions,
    ].sort((a, b) => a.timestamp - b.timestamp);

    const fmt = (ts: number) => {
      const d = new Date(ts);
      const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    if (allTransactions.length === 0) {
      return [{ value: currentBalance, label: "Actual" }];
    }

    const included = allTransactions.filter((t) => t.is_excluded === 0);
    let effect = 0;
    included.forEach((t) => {
      effect += t.type === "income" ? t.amount : -t.amount;
    });

    let running = currentBalance - effect;
    const history = [{ value: running, label: "Inicio" }];
    included.forEach((t) => {
      running += t.type === "income" ? t.amount : -t.amount;
      history.push({ value: running, label: fmt(t.timestamp) });
    });
    return history;
  }, [stats.incomeTransactions, stats.expenseTransactions, currency, currentBalance]);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 64;

  const values = balanceHistory.map((i) => i.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const absMax = Math.max(Math.abs(maxVal), Math.abs(minVal));
  const chartMax = minVal >= 0 ? Math.max(maxVal * 1.2, 100) : absMax * 1.2;
  const chartMin = minVal < 0 ? -absMax * 1.2 : 0;

  const statItems = [
    { label: "Ingresos", value: `+${sym}${stats.totalIncome.toFixed(2)}`, color: theme.good },
    { label: "Gastos", value: `-${sym}${stats.totalExpenses.toFixed(2)}`, color: theme.bad },
    { label: "Movimientos", value: `${stats.transactionCount}`, color: accent },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        {statItems.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textTer }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Line chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>Historial de balance</Text>
        {balanceHistory.length > 1 ? (
          <View style={styles.chartWrap}>
            <LineChart
              isAnimated
              animationDuration={800}
              data={balanceHistory}
              width={chartWidth}
              height={140}
              color={accent}
              thickness={2.5}
              dataPointsColor={accent}
              dataPointsRadius={3}
              curved
              hideYAxisText
              hideRules
              xAxisColor={theme.border}
              yAxisColor="transparent"
              xAxisLabelTextStyle={{ color: theme.textTer, fontSize: 9 }}
              maxValue={chartMax}
              mostNegativeValue={chartMin}
              startFillColor={`${accent}30`}
              endFillColor={`${accent}00`}
              areaChart
              focusEnabled
              showTextOnFocus
              showStripOnFocus
              stripColor={accent}
              stripOpacity={0.2}
              textFontSize={10}
              textColor={theme.textSec}
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={[styles.emptyChartText, { color: theme.textTer }]}>
              Agrega más transacciones para ver el historial
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: { fontSize: 13, fontWeight: "700", letterSpacing: -0.3 },
  statLabel: { fontSize: 10 },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  chartTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12, letterSpacing: -0.2 },
  chartWrap: { marginLeft: -10 },
  emptyChart: { height: 100, alignItems: "center", justifyContent: "center" },
  emptyChartText: { fontSize: 13, textAlign: "center" },
});
