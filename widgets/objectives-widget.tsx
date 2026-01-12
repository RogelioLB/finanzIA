import { useObjectives } from "@/contexts/ObjectivesContext";
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ObjectivesWidget() {
  const router = useRouter();
  const { objectives } = useObjectives();
  const { defaultCurrency } = useUser();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: defaultCurrency || "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const savingsGoals = objectives.filter((o) => o.type === "savings");
  const debts = objectives.filter((o) => o.type === "debt");

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalSavingsGoal = savingsGoals.reduce((sum, g) => sum + g.amount, 0);
  const totalDebtPaid = debts.reduce((sum, d) => sum + d.current_amount, 0);
  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);

  if (objectives.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={() => router.push("/objectives/add")}
      >
        <View style={styles.emptyIcon}>
          <Ionicons name="flag-outline" size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>Sin objetivos</Text>
        <Text style={styles.emptyText}>Crea metas de ahorro o registra deudas</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/objectives")}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flag" size={20} color="#4CAF50" />
          <Text style={styles.title}>Objetivos</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.statsRow}>
        {savingsGoals.length > 0 && (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="trending-up" size={16} color="#059669" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Ahorros</Text>
              <Text style={[styles.statValue, { color: "#059669" }]}>
                {formatCurrency(totalSaved)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${totalSavingsGoal > 0 ? Math.min(100, (totalSaved / totalSavingsGoal) * 100) : 0}%`,
                      backgroundColor: "#059669",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                de {formatCurrency(totalSavingsGoal)}
              </Text>
            </View>
          </View>
        )}

        {debts.length > 0 && (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="trending-down" size={16} color="#DC2626" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Deudas</Text>
              <Text style={[styles.statValue, { color: "#DC2626" }]}>
                {formatCurrency(totalDebt - totalDebtPaid)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${totalDebt > 0 ? Math.min(100, (totalDebtPaid / totalDebt) * 100) : 0}%`,
                      backgroundColor: "#DC2626",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {((totalDebtPaid / totalDebt) * 100).toFixed(0)}% pagado
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.objectivesList}>
        {objectives.slice(0, 2).map((obj) => {
          const progress = (obj.current_amount / obj.amount) * 100;
          const isSavings = obj.type === "savings";
          return (
            <View key={obj.id} style={styles.objectiveItem}>
              <View
                style={[
                  styles.objectiveIcon,
                  { backgroundColor: isSavings ? "#D1FAE5" : "#FEE2E2" },
                ]}
              >
                <Text style={styles.objectiveEmoji}>
                  {obj.icon || (isSavings ? "🎯" : "💳")}
                </Text>
              </View>
              <View style={styles.objectiveInfo}>
                <Text style={styles.objectiveTitle} numberOfLines={1}>
                  {obj.title}
                </Text>
                <View style={styles.objectiveProgressBar}>
                  <View
                    style={[
                      styles.objectiveProgressFill,
                      {
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: isSavings ? "#059669" : "#DC2626",
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.objectivePercentage}>{progress.toFixed(0)}%</Text>
            </View>
          );
        })}
        {objectives.length > 2 && (
          <Text style={styles.moreObjectives}>
            +{objectives.length - 2} más
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  objectivesList: {
    gap: 10,
  },
  objectiveItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  objectiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  objectiveEmoji: {
    fontSize: 18,
  },
  objectiveInfo: {
    flex: 1,
  },
  objectiveTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  objectiveProgressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  objectiveProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  objectivePercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  moreObjectives: {
    fontSize: 13,
    color: "#7952FC",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
});
