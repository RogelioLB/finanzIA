import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { currencies, Currency } from "../../../../constants/currencies";
import { useSQLiteService } from "../../../../lib/database/sqliteService";
import { Transaction } from "./types";

interface CategoryStatsProps {
  transactions: Transaction[];
  totalAmount: number;
  currency: string;
}

const CategoryStats: React.FC<CategoryStatsProps> = ({
  transactions,
  totalAmount,
  currency,
}) => {
  const { getCategoryById } = useSQLiteService();
  const [categoryStats, setCategoryStats] = useState<{
    [key: string]: {
      amount: number;
      count: number;
      percentage: number;
      icon: string;
      color: string;
    };
  }>({});

  useEffect(() => {
    const calculateCategoryStats = async () => {
      const stats: {
        [key: string]: {
          amount: number;
          count: number;
          percentage: number;
          icon: string;
          color: string;
        };
      } = {};

      // Procesar transacciones de forma asíncrona
      for (const transaction of transactions) {
        const categoryId = transaction.category_id;
        let categoryName = "Sin categoría";
        let categoryIcon = "📊";
        let categoryColor = "#8B5CF6";

        if (categoryId) {
          try {
            const category = await getCategoryById(categoryId);
            categoryName = category?.name || "Sin categoría";
            categoryIcon = category?.icon || "📊";
            categoryColor = category?.color || "#8B5CF6";
          } catch (error) {
            console.error("Error getting category:", error);
          }
        }

        if (!stats[categoryName]) {
          stats[categoryName] = {
            amount: 0,
            count: 0,
            percentage: 0,
            icon: categoryIcon,
            color: categoryColor,
          };
        }
        stats[categoryName].amount += transaction.amount;
        stats[categoryName].count += 1;
      }

      // Calcular porcentajes
      Object.keys(stats).forEach((categoryName) => {
        stats[categoryName].percentage =
          totalAmount > 0
            ? (stats[categoryName].amount / totalAmount) * 100
            : 0;
      });

      setCategoryStats(stats);
    };

    if (transactions.length > 0) {
      calculateCategoryStats();
    } else {
      setCategoryStats({});
    }
  }, [transactions, totalAmount]);

  const getCurrencySymbol = (currency: string) => {
    const currencyObj = currencies.find((c: Currency) => c.code === currency);
    return currencyObj?.symbol || "$";
  };

  const categoryEntries = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 5); // Top 5 categorías

  if (categoryEntries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Distribución por Categorías</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay datos de categorías</Text>
        </View>
      </View>
    );
  }

  // Preparar datos para el gráfico de pastel
  const pieData = categoryEntries.map(([categoryName, data], index) => ({
    value: data.amount,
    color: data.color,
    text: `${data.percentage.toFixed(1)}%`,
    textColor: "#fff",
    textSize: 12,
    fontWeight: "600",
    category: categoryName,
    count: data.count,
    icon: data.icon,
  }));

  if (categoryEntries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Distribución por Categorías</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay datos para mostrar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribución por Categorías</Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          radius={80}
          innerRadius={40}
          showText
          textSize={12}
          textColor="#fff"
          fontWeight="800"
          showValuesAsLabels
          isAnimated
          animationDuration={1000}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelText}>Total</Text>
              <Text style={styles.centerLabelAmount}>
                {getCurrencySymbol(currency)}
                {totalAmount.toFixed(0)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        {pieData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendIcon}>{item.icon}</Text>
            <View style={styles.legendText}>
              <Text style={styles.legendCategory}>{item.category}</Text>
              <Text style={styles.legendDetails}>
                {item.count} transacciones • {getCurrencySymbol(currency)}
                {item.value.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  centerLabelAmount: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    marginTop: 2,
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
  legendCategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  legendDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

export default CategoryStats;
