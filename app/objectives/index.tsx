import { useObjectives } from "@/contexts/ObjectivesContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ObjectivesScreen() {
  const router = useRouter();
  const {
    objectives,
    savingsGoals,
    debts,
    isLoading,
    getTotalDebt,
    getTotalSavings,
    getMonthlyPaymentNeeded,
  } = useObjectives();

  const totalDebt = getTotalDebt();
  const totalSavings = getTotalSavings();
  const monthlyNeeded = getMonthlyPaymentNeeded();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#4CAF50";
    if (progress >= 50) return "#FFA500";
    if (progress >= 25) return "#FF9800";
    return "#FF6B6B";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Objetivos Financieros</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/objectives/add")}
        >
          <Ionicons name="add" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen General */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.summaryLabel}>Ahorrado</Text>
              <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
                {formatCurrency(totalSavings)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="trending-down" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.summaryLabel}>Deuda pendiente</Text>
              <Text style={[styles.summaryValue, { color: "#FF6B6B" }]}>
                {formatCurrency(totalDebt)}
              </Text>
            </View>
          </View>
          {monthlyNeeded > 0 && (
            <View style={styles.monthlyNeeded}>
              <Ionicons name="calendar-outline" size={18} color="#7952FC" />
              <Text style={styles.monthlyNeededText}>
                Necesitas {formatCurrency(monthlyNeeded)}/mes para cumplir tus metas
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Metas de Ahorro */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="wallet-outline" size={22} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Metas de Ahorro</Text>
            </View>
            <Text style={styles.sectionCount}>{savingsGoals.length}</Text>
          </View>

          {savingsGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tienes metas de ahorro</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/objectives/add")}
              >
                <Text style={styles.emptyButtonText}>Crear meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savingsGoals.map((goal, index) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.objectiveCard}
                onPress={() => router.push(`/objectives/edit/${goal.id}`)}
              >
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveTitle}>{goal.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: "#E8F5E9" }]}>
                    <Text style={[styles.typeBadgeText, { color: "#4CAF50" }]}>
                      Ahorro
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${goal.progress || 0}%`,
                          backgroundColor: getProgressColor(goal.progress || 0),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {(goal.progress || 0).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.objectiveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actual:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(goal.current_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Meta:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(goal.amount)}
                    </Text>
                  </View>
                  {goal.monthlyPayment && goal.monthlyPayment > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ahorro mensual:</Text>
                      <Text style={[styles.detailValue, { color: "#7952FC" }]}>
                        {formatCurrency(goal.monthlyPayment)}
                      </Text>
                    </View>
                  )}
                  {goal.monthsRemaining && goal.monthsRemaining > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tiempo restante:</Text>
                      <Text style={styles.detailValue}>
                        {goal.monthsRemaining} meses
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Deudas */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="card-outline" size={22} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Deudas</Text>
            </View>
            <Text style={styles.sectionCount}>{debts.length}</Text>
          </View>

          {debts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
              <Text style={styles.emptyText}>Sin deudas pendientes</Text>
              <Text style={styles.emptySubtext}>Excelente trabajo</Text>
            </View>
          ) : (
            debts.map((debt, index) => (
              <TouchableOpacity
                key={debt.id}
                style={styles.objectiveCard}
                onPress={() => router.push(`/objectives/edit/${debt.id}`)}
              >
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveTitle}>{debt.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: "#FFEBEE" }]}>
                    <Text style={[styles.typeBadgeText, { color: "#FF6B6B" }]}>
                      Deuda
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${debt.progress || 0}%`,
                          backgroundColor: getProgressColor(debt.progress || 0),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {(debt.progress || 0).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.objectiveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pagado:</Text>
                    <Text style={[styles.detailValue, { color: "#4CAF50" }]}>
                      {formatCurrency(debt.current_amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total deuda:</Text>
                    <Text style={[styles.detailValue, { color: "#FF6B6B" }]}>
                      {formatCurrency(debt.amount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Restante:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(debt.remaining || 0)}
                    </Text>
                  </View>
                  {debt.monthlyPayment && debt.monthlyPayment > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pago mensual:</Text>
                      <Text style={[styles.detailValue, { color: "#7952FC" }]}>
                        {formatCurrency(debt.monthlyPayment)}
                      </Text>
                    </View>
                  )}
                  {debt.monthsRemaining && debt.monthsRemaining > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pagos restantes:</Text>
                      <Text style={styles.detailValue}>
                        {debt.monthsRemaining} meses
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/objectives/add")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  monthlyNeeded: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  monthlyNeededText: {
    fontSize: 14,
    color: "#7952FC",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  sectionCount: {
    fontSize: 14,
    color: "#9CA3AF",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#7952FC",
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  objectiveCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  objectiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  objectiveTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 40,
    textAlign: "right",
  },
  objectiveDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7952FC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
