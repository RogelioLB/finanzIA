import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

interface ChatChartProps {
  type: "bar" | "pie" | "line";
  title: string;
  data: any[];
}

export default function ChatChart({ type, title, data }: ChatChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  try {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.chartWrapper}>
          {type === "pie" && (
            <PieChart
              data={data}
              donut
              radius={70}
              innerRadius={45}
              centerLabelComponent={() => {
                const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
                return (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterValue}>
                      ${total.toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                );
              }}
            />
          )}

          {type === "bar" && (
            <BarChart
              data={data}
              barWidth={32}
              spacing={16}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              noOfSections={4}
              isAnimated
              animationDuration={1000}
              yAxisTextStyle={{ color: "#6B7280", fontSize: 12 }}
              xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 11 }}
              maxValue={
                Math.max(...data.map((d) => d.value || 0)) * 1.1
              }
            />
          )}
        </View>
      </View>
    );
  } catch (error) {
    console.error("[ChatChart] Error rendering chart:", error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al renderizar gráfico</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  pieCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieCenterValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7952FC",
  },
  errorContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
  },
});
