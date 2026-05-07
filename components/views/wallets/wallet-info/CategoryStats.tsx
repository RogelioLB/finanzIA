import { currencies, Currency } from "@/constants/currencies";
import { useSQLiteService } from "@/lib/database/sqliteService";
import { useTheme } from "@/theme/ThemeProvider";
import React, { useEffect, useState } from "react";
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
  const { getCategoryById } = useSQLiteService();
  const [stats, setStats] = useState<Record<string, CatStat>>({});

  const sym = currencies.find((c: Currency) => c.code === currency)?.symbol || "$";

  useEffect(() => {
    if (transactions.length === 0) { setStats({}); return; }
    const calc = async () => {
      const s: Record<string, CatStat> = {};
      for (const t of transactions) {
        let name = "Sin categoría", icon = "📊", color = accent;
        if (t.category_id) {
          try {
            const cat = await getCategoryById(t.category_id);
            if (cat) { name = cat.name; icon = cat.icon; color = cat.color; }
          } catch {}
        }
        if (!s[name]) s[name] = { amount: 0, count: 0, percentage: 0, icon, color };
        s[name].amount += t.amount;
        s[name].count += 1;
      }
      Object.values(s).forEach((v) => {
        v.percentage = totalAmount > 0 ? (v.amount / totalAmount) * 100 : 0;
      });
      setStats(s);
    };
    calc();
  }, [transactions, totalAmount]);

  const entries = Object.entries(stats)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 5);

  if (entries.length === 0) return null;

  const pieData = entries.map(([name, d]) => ({
    value: d.amount,
    color: d.color,
    text: `${d.percentage.toFixed(0)}%`,
    textColor: "#fff",
    textSize: 11,
    category: name,
    count: d.count,
    icon: d.icon,
  }));

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Por categoría</Text>

      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          radius={72}
          innerRadius={40}
          showText
          textSize={11}
          textColor="#fff"
          fontWeight="700"
          isAnimated
          animationDuration={800}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={[styles.centerLabel, { color: theme.textTer }]}>Total</Text>
              <Text style={[styles.centerAmount, { color: theme.text }]}>
                {sym}{totalAmount.toFixed(0)}
              </Text>
            </View>
          )}
        />

        <View style={styles.legend}>
          {pieData.map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.legendName, { color: theme.text }]} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={[styles.legendSub, { color: theme.textTer }]}>
                  {sym}{item.value.toFixed(0)} · {item.count}
                </Text>
              </View>
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
  title: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2, marginBottom: 16 },
  chartRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  center: { alignItems: "center" },
  centerLabel: { fontSize: 10 },
  centerAmount: { fontSize: 12, fontWeight: "700", marginTop: 1 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendIcon: { fontSize: 14 },
  legendName: { fontSize: 12, fontWeight: "500" },
  legendSub: { fontSize: 10, marginTop: 1 },
});
