import { currencies, Currency } from "@/constants/currencies";
import { CategoryIcon } from "@/components/views/forms/categoryIcon";
import { useTheme } from "@/theme/ThemeProvider";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Transaction } from "./types";

interface CategoryStatsProps {
  transactions: Transaction[];
  totalAmount: number;
  currency: string;
}

interface CatStat {
  amount: number;
  count: number;
  percentage: number;
  icon: string;
  color: string;
}

export default function CategoryStats({ transactions, totalAmount, currency }: CategoryStatsProps) {
  const { theme, accent } = useTheme();
  const sym = currencies.find((c: Currency) => c.code === currency)?.symbol || "$";

  // Usa los campos ya unidos por el JOIN — sin llamadas async
  const entries = useMemo(() => {
    const stats: Record<string, CatStat> = {};
    for (const t of transactions) {
      const name = t.category_name || "Sin categoría";
      const icon = t.category_icon || "📊";
      const color = t.category_color || accent;
      if (!stats[name]) stats[name] = { amount: 0, count: 0, percentage: 0, icon, color };
      stats[name].amount += t.amount;
      stats[name].count += 1;
    }
    return Object.entries(stats)
      .map(([name, d]) => ({
        name,
        ...d,
        percentage: totalAmount > 0 ? (d.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, totalAmount, accent]);

  if (entries.length === 0) return null;

  const pieData = entries.map((e) => ({
    value: e.amount,
    color: e.color,
    text: `${e.percentage.toFixed(0)}%`,
    textColor: "#fff",
    textSize: 11,
  }));

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Por categoría</Text>

      <View style={styles.body}>
        <View>
          <PieChart
            data={pieData}
            radius={68}
            innerRadius={38}
            showText
            textSize={11}
            textColor="#fff"
            fontWeight="700"
            isAnimated
            animationDuration={600}
            centerLabelComponent={() => (
              <View style={[styles.center, { backgroundColor: theme.surface }]}>
                <Text style={[styles.centerLabel, { color: theme.textTer }]}>Total</Text>
                <Text style={[styles.centerAmount, { color: theme.text }]}>
                  {sym}{totalAmount.toFixed(0)}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.legend}>
          {entries.map((e, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${e.color}22` }]}>
                <CategoryIcon
                  category={{ icon: e.icon, name: e.name }}
                  size={14}
                  color={e.color}
                  strokeWidth={1.8}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                  {e.name}
                </Text>
                <Text style={[styles.sub, { color: theme.textTer }]}>
                  {sym}{e.amount.toFixed(0)} · {e.count} mov.
                </Text>
              </View>
              <Text style={[styles.pct, { color: theme.textSec }]}>
                {e.percentage.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2, marginBottom: 14 },
  body: { flexDirection: "row", alignItems: "center", gap: 16 },
  center: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: { fontSize: 9 },
  centerAmount: { fontSize: 11, fontWeight: "700", marginTop: 1 },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name: { fontSize: 12, fontWeight: "500" },
  sub: { fontSize: 10, marginTop: 1 },
  pct: { fontSize: 11, fontWeight: "600", marginLeft: 4 },
});
