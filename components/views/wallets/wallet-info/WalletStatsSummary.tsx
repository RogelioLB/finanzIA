import { currencies, Currency } from "@/constants/currencies";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { WalletStats } from "./types";

interface WalletStatsSummaryProps {
  stats: WalletStats;
  currency: string;
  currentBalance: number;
}

export default function WalletStatsSummary({
  stats,
  currency,
  currentBalance,
}: WalletStatsSummaryProps) {
  const getCurrencySymbol = (currency: string) => {
    const currencyObj = currencies.find((c: Currency) => c.code === currency);
    return currencyObj?.symbol || "$";
  };

  const balanceHistory = useMemo(() => {
    // Combinar todas las transacciones y ordenarlas por fecha
    const allTransactions = [
      ...stats.incomeTransactions,
      ...stats.expenseTransactions,
    ].sort((a, b) => a.timestamp - b.timestamp);

    // El balance inicial es el balance actual menos el efecto neto de las transacciones
    const initialBalance = currentBalance - stats.netBalance;

    // Función para formatear fecha con día y mes en 3 letras
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const day = date.getDate();

      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];

      const monthAbbr = monthNames[date.getMonth()];

      return `${day} ${monthAbbr}`;
    };

    if (allTransactions.length === 0) {
      // Si no hay transacciones, mostrar solo el balance actual
      return [
        {
          value: currentBalance,
          dataPointText:
            getCurrencySymbol(currency) + currentBalance.toFixed(0),
          label: "Hoy",
        },
      ];
    }

    // Comenzar desde el balance inicial calculado
    let runningBalance = initialBalance;

    // Agregar punto inicial
    const history = [
      {
        value: initialBalance,
        dataPointText: getCurrencySymbol(currency) + initialBalance.toFixed(0),
        label: "Inicio",
      },
    ];

    // Procesar cada transacción cronológicamente
    allTransactions.forEach((transaction, index) => {
      if (transaction.type === "income") {
        runningBalance += transaction.amount;
      } else if (transaction.type === "expense") {
        runningBalance -= transaction.amount;
      }

      history.push({
        value: runningBalance,
        dataPointText: getCurrencySymbol(currency) + runningBalance.toFixed(0),
        label: formatDate(transaction.timestamp),
      });
    });

    return history;
  }, [
    stats.incomeTransactions,
    stats.expenseTransactions,
    currency,
    currentBalance,
    stats.netBalance,
  ]);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32; // 16px padding on each side

  return (
    <View>
      {/* Gráfica de Balance Histórico */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Balance a través del tiempo</Text>
        {balanceHistory.length > 1 ? (
          <LineChart
            data={balanceHistory}
            width={chartWidth}
            height={200}
            color="#8B5CF6"
            thickness={3}
            dataPointsColor="#8B5CF6"
            dataPointsRadius={4}
            curved
            hideYAxisText
            hideRules
            hideAxesAndRules={false}
            xAxisColor="#E5E7EB"
            xAxisLabelTextStyle={{ color: "#666", fontSize: 10 }}
            maxValue={
              Math.max(...balanceHistory.map((item) => item.value)) * 1.1
            }
            animateOnDataChange
            animationDuration={1000}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No hay suficientes transacciones para mostrar la gráfica
            </Text>
          </View>
        )}
      </View>

      {/* Estadísticas Resumidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ingresos</Text>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>
            +{getCurrencySymbol(currency)}
            {stats.totalIncome.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Gastos</Text>
          <Text style={[styles.statValue, { color: "#FF6B6B" }]}>
            -{getCurrencySymbol(currency)}
            {stats.totalExpenses.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Transacciones</Text>
          <Text style={styles.statValue}>{stats.transactionCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  noDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
