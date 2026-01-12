import TransitionLayout from "@/components/ui/TransitionLayout";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

type TimeRange = "week" | "month" | "year";

export default function StatisticScreen() {
  const { transactions } = useTransactions();
  const { defaultCurrency } = useUser();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: defaultCurrency || "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions by time range
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let startDate: number;

    switch (timeRange) {
      case "week":
        startDate = now - 7 * oneDay;
        break;
      case "month":
        startDate = now - 30 * oneDay;
        break;
      case "year":
        startDate = now - 365 * oneDay;
        break;
    }

    return transactions.filter((t) => t.timestamp >= startDate);
  }, [transactions, timeRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income" && !t.is_excluded)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === "expense" && !t.is_excluded)
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const categories: Record<string, { total: number; color: string; icon: string }> = {};

    filteredTransactions
      .filter((t) => t.type === "expense" && !t.is_excluded)
      .forEach((t) => {
        const name = t.category_name || "Sin categoría";
        if (!categories[name]) {
          categories[name] = {
            total: 0,
            color: t.category_color || "#6B7280",
            icon: t.category_icon || "help-circle",
          };
        }
        categories[name].total += t.amount;
      });

    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totals.expenses > 0 ? (data.total / totals.expenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // Top 6 categories
  }, [filteredTransactions, totals.expenses]);

  // Pie chart data
  const pieData = useMemo(() => {
    return categoryData.map((cat) => ({
      value: cat.total,
      color: cat.color,
      text: `${cat.percentage.toFixed(0)}%`,
      textColor: "#fff",
    }));
  }, [categoryData]);

  // Daily/Weekly bar chart data
  const barChartData = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const data: { label: string; value: number; frontColor: string }[] = [];

    if (timeRange === "week") {
      // Last 7 days
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      for (let i = 6; i >= 0; i--) {
        const dayStart = now - i * oneDay;
        const dayEnd = dayStart + oneDay;
        const dayExpenses = filteredTransactions
          .filter(
            (t) =>
              t.type === "expense" &&
              !t.is_excluded &&
              t.timestamp >= dayStart &&
              t.timestamp < dayEnd
          )
          .reduce((sum, t) => sum + t.amount, 0);
        const date = new Date(dayStart);
        data.push({
          label: days[date.getDay()],
          value: dayExpenses,
          frontColor: "#7952FC",
        });
      }
    } else if (timeRange === "month") {
      // Last 4 weeks
      const weekLabels = ["Sem 4", "Sem 3", "Sem 2", "Sem 1"];
      for (let i = 3; i >= 0; i--) {
        const weekStart = now - (i + 1) * 7 * oneDay;
        const weekEnd = weekStart + 7 * oneDay;
        const weekExpenses = filteredTransactions
          .filter(
            (t) =>
              t.type === "expense" &&
              !t.is_excluded &&
              t.timestamp >= weekStart &&
              t.timestamp < weekEnd
          )
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({
          label: weekLabels[3 - i],
          value: weekExpenses,
          frontColor: "#7952FC",
        });
      }
    } else {
      // Last 12 months
      const months = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
      const currentMonth = new Date().getMonth();
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthExpenses = filteredTransactions
          .filter(
            (t) =>
              t.type === "expense" &&
              !t.is_excluded &&
              t.timestamp >= monthStart.getTime() &&
              t.timestamp < monthEnd.getTime()
          )
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({
          label: months[monthIndex],
          value: monthExpenses,
          frontColor: "#7952FC",
        });
      }
    }

    return data;
  }, [filteredTransactions, timeRange]);

  // Calculate average daily spending
  const avgDailySpending = useMemo(() => {
    const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
    return totals.expenses / days;
  }, [totals.expenses, timeRange]);

  const timeRangeLabels = {
    week: "Esta semana",
    month: "Este mes",
    year: "Este año",
  };

  return (
    <TransitionLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Análisis de tus finanzas</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(["week", "month", "year"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === "week" ? "7 días" : range === "month" ? "30 días" : "1 año"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="arrow-down" size={20} color="#059669" />
            </View>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryValue, { color: "#059669" }]}>
              {formatCurrency(totals.income)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="arrow-up" size={20} color="#DC2626" />
            </View>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, { color: "#DC2626" }]}>
              {formatCurrency(totals.expenses)}
            </Text>
          </View>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance {timeRangeLabels[timeRange]}</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: totals.balance >= 0 ? "#059669" : "#DC2626" },
            ]}
          >
            {totals.balance >= 0 ? "+" : ""}
            {formatCurrency(totals.balance)}
          </Text>
          <View style={styles.avgSpending}>
            <Ionicons name="trending-down" size={16} color="#6B7280" />
            <Text style={styles.avgSpendingText}>
              Gasto diario promedio: {formatCurrency(avgDailySpending)}
            </Text>
          </View>
        </Animated.View>

        {/* Spending by Time Chart */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gastos por período</Text>
          {barChartData.length > 0 && barChartData.some((d) => d.value > 0) ? (
            <View style={styles.barChartContainer}>
              <BarChart
                data={barChartData}
                barWidth={timeRange === "year" ? 16 : 28}
                spacing={timeRange === "year" ? 8 : 16}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...barChartData.map((d) => d.value)) * 1.2 || 1000}
                isAnimated
                animationDuration={500}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyChartText}>Sin datos para mostrar</Text>
            </View>
          )}
        </Animated.View>

        {/* Category Breakdown */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gastos por categoría</Text>
          {categoryData.length > 0 ? (
            <View style={styles.pieChartContainer}>
              <View style={styles.pieChartWrapper}>
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterLabel}>Total</Text>
                      <Text style={styles.pieCenterValue}>
                        {formatCurrency(totals.expenses)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.categoryList}>
                {categoryData.map((cat, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: cat.color }]}
                      />
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(cat.total)}
                      </Text>
                      <Text style={styles.categoryPercentage}>
                        {cat.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyChartText}>Sin gastos registrados</Text>
            </View>
          )}
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Insights</Text>
          {categoryData.length > 0 && (
            <>
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="star" size={16} color="#D97706" />
                </View>
                <Text style={styles.insightText}>
                  Tu mayor gasto es en{" "}
                  <Text style={styles.insightBold}>{categoryData[0].name}</Text> con{" "}
                  {categoryData[0].percentage.toFixed(0)}% del total
                </Text>
              </View>
              {totals.balance > 0 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: "#D1FAE5" }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  </View>
                  <Text style={styles.insightText}>
                    Has ahorrado{" "}
                    <Text style={styles.insightBold}>{formatCurrency(totals.balance)}</Text>{" "}
                    {timeRangeLabels[timeRange].toLowerCase()}
                  </Text>
                </View>
              )}
              {totals.balance < 0 && (
                <View style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: "#FEE2E2" }]}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.insightText}>
                    Has gastado{" "}
                    <Text style={styles.insightBold}>
                      {formatCurrency(Math.abs(totals.balance))}
                    </Text>{" "}
                    más de lo que ingresaste
                  </Text>
                </View>
              )}
            </>
          )}
          {categoryData.length === 0 && (
            <Text style={styles.noInsightsText}>
              Registra transacciones para ver insights personalizados
            </Text>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  timeRangeContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeRangeButtonActive: {
    backgroundColor: "#7952FC",
    borderColor: "#7952FC",
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  timeRangeTextActive: {
    color: "#fff",
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  balanceCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  avgSpending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  avgSpendingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  chartCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  barChartContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  pieChartContainer: {
    alignItems: "center",
  },
  pieChartWrapper: {
    marginBottom: 20,
  },
  pieCenter: {
    alignItems: "center",
  },
  pieCenterLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  pieCenterValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  categoryList: {
    width: "100%",
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  categoryRight: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  categoryPercentage: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyChart: {
    alignItems: "center",
    padding: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  insightsCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  insightBold: {
    fontWeight: "600",
    color: "#1F2937",
  },
  noInsightsText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
