import TransitionLayout from "@/components/ui/TransitionLayout";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

interface FinancialPlan {
  summary: string;
  monthlyBudget: {
    income: number;
    expenses: number;
    savings: number;
    savingsPercentage: number;
  };
  recommendations: Array<{
    category: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
    potentialSavings?: number;
  }>;
  spendingPatterns: Array<{
    category: string;
    percentage: number;
    trend: "increasing" | "stable" | "decreasing";
  }>;
  goals: Array<{
    title: string;
    targetAmount: number;
    monthsToAchieve: number;
    monthlySavingsNeeded: number;
  }>;
}

export default function AiPlanScreen() {
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughData = transactions.length >= 10;

  const generatePlan = async () => {
    if (!hasEnoughData) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Preparar datos para la API (incluir TODAS las transacciones, incluso las excluidas)
      const transactionSummary = transactions.map(t => ({
        amount: t.amount,
        type: t.type,
        category: t.category_name || "Sin categoría",
        title: t.title || "",
        timestamp: t.timestamp,
        is_subscription: t.is_subscription || 0,
        is_excluded: t.is_excluded || 0,
        subscription_frequency: t.subscription_frequency || null,
        next_payment_date: t.next_payment_date || null,
      }));

      const totalBalance = wallets.reduce((sum, w) => sum + (w.net_balance || 0), 0);

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: transactionSummary,
          totalBalance,
          transactionCount: transactions.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el plan");
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (err) {
      console.error("Error generating plan:", err);
      setError("No se pudo generar el plan. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF6B6B";
      case "medium":
        return "#FFA500";
      case "low":
        return "#4CAF50";
      default:
        return "#999";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  return (
    <TransitionLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={32} color="#7952FC" />
          </View>
          <Text style={styles.title}>Plan Financiero IA</Text>
          <Text style={styles.subtitle}>
            Análisis inteligente de tus finanzas
          </Text>
        </View>

        {/* Estado de datos */}
        <View style={styles.dataStatusCard}>
          <View style={styles.dataStatusHeader}>
            <Ionicons
              name={hasEnoughData ? "checkmark-circle" : "information-circle"}
              size={24}
              color={hasEnoughData ? "#4CAF50" : "#FFA500"}
            />
            <Text style={styles.dataStatusTitle}>
              {hasEnoughData
                ? "Datos suficientes"
                : "Necesitas más transacciones"}
            </Text>
          </View>
          <Text style={styles.dataStatusText}>
            {transactions.length} de 10 transacciones mínimas
          </Text>
          {!hasEnoughData && (
            <Text style={styles.dataStatusSubtext}>
              Agrega {Math.max(0, 10 - transactions.length)} transacciones más para generar
              tu plan personalizado
            </Text>
          )}
        </View>

        {/* Botón generar plan */}
        {hasEnoughData && !plan && (
          <Animated.View entering={FadeIn.delay(200)}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={generatePlan}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateButtonText}>Generando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>
                    Generar Plan con IA
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Error */}
        {error && (
          <Animated.View entering={FadeIn} style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Plan generado */}
        {plan && (
          <Animated.View entering={FadeInDown.delay(300)}>
            {/* Resumen */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Resumen General</Text>
              <View style={styles.card}>
                <Text style={styles.summaryText}>{plan.summary}</Text>
              </View>
            </View>

            {/* Presupuesto mensual */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Presupuesto Mensual</Text>
              <View style={styles.card}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Ingresos</Text>
                  <Text style={[styles.budgetValue, { color: "#4CAF50" }]}>
                    ${plan.monthlyBudget.income.toLocaleString("es-MX")}
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Gastos</Text>
                  <Text style={[styles.budgetValue, { color: "#FF6B6B" }]}>
                    ${plan.monthlyBudget.expenses.toLocaleString("es-MX")}
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Ahorro</Text>
                  <Text style={[styles.budgetValue, { color: "#7952FC" }]}>
                    ${plan.monthlyBudget.savings.toLocaleString("es-MX")}
                  </Text>
                </View>
                <View style={styles.savingsPercentage}>
                  <Text style={styles.savingsPercentageText}>
                    {plan.monthlyBudget.savingsPercentage}% de ahorro
                  </Text>
                </View>
              </View>
            </View>

            {/* Recomendaciones */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recomendaciones</Text>
              {plan.recommendations.map((rec, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(400 + index * 100)}
                  style={styles.card}
                >
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationCategory}>
                      {rec.category}
                    </Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(rec.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {getPriorityLabel(rec.priority)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recommendationText}>
                    {rec.suggestion}
                  </Text>
                  {rec.potentialSavings && (
                    <Text style={styles.potentialSavings}>
                      <Text>Ahorro potencial: $</Text>
                      <Text>{rec.potentialSavings.toLocaleString("es-MX")}</Text>
                    </Text>
                  )}
                </Animated.View>
              ))}
            </View>

            {/* Patrones de gasto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Patrones de Gasto</Text>
              {plan.spendingPatterns.map((pattern, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternCategory}>
                      {pattern.category}
                    </Text>
                    <Text style={styles.patternPercentage}>
                      {pattern.percentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pattern.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendText}>
                    <Text>Tendencia: </Text>
                    <Text>
                      {pattern.trend === "increasing"
                        ? "📈 Aumentando"
                        : pattern.trend === "decreasing"
                        ? "📉 Disminuyendo"
                        : "➡️ Estable"}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>

            {/* Metas sugeridas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Metas Sugeridas</Text>
              {plan.goals.map((goal, index) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <View style={styles.goalDetails}>
                    <View style={styles.goalRow}>
                      <Text style={styles.goalLabel}>Meta:</Text>
                      <Text style={styles.goalValue}>
                        ${goal.targetAmount.toLocaleString("es-MX")}
                      </Text>
                    </View>
                    <View style={styles.goalRow}>
                      <Text style={styles.goalLabel}>Plazo:</Text>
                      <Text style={styles.goalValue}>
                        {goal.monthsToAchieve} meses
                      </Text>
                    </View>
                    <View style={styles.goalRow}>
                      <Text style={styles.goalLabel}>Ahorro mensual:</Text>
                      <Text style={[styles.goalValue, { color: "#7952FC" }]}>
                        ${goal.monthlySavingsNeeded.toLocaleString("es-MX")}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Botón regenerar */}
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={generatePlan}
              disabled={isGenerating}
            >
              <Ionicons name="refresh" size={20} color="#7952FC" />
              <Text style={styles.regenerateButtonText}>Regenerar Plan</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
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
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  dataStatusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dataStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  dataStatusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  dataStatusText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  dataStatusSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    margin: 16,
    padding: 18,
    backgroundColor: "#7952FC",
    borderRadius: 16,
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  savingsPercentage: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
  },
  savingsPercentageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7952FC",
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 8,
  },
  potentialSavings: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  patternHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  patternCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  patternPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7952FC",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7952FC",
  },
  trendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  goalDetails: {
    gap: 12,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7952FC",
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7952FC",
  },
});
