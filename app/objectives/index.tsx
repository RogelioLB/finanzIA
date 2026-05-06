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
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { MXN } from "@/theme/format";

export default function ObjectivesScreen() {
  const { theme, accent, density } = useTheme();
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

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const totalDebt = getTotalDebt();
  const totalSavings = getTotalSavings();
  const monthlyNeeded = getMonthlyPaymentNeeded();

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return theme.good;
    if (progress >= 50) return "#F59E0B";
    if (progress >= 25) return "#F97316";
    return theme.bad;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Objetivos Financieros</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: accent, borderRadius: 10 }]}
          onPress={() => router.push("/objectives/add")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: pad, paddingBottom: 100 }}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.summaryTitle, { color: theme.textSec }]}>Resumen</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: `${theme.good}22` }]}>
                <DesignIcon.TrendUp size={18} color={theme.good} strokeWidth={1.8} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.textTer }]}>Ahorrado</Text>
              <Text style={[styles.summaryValue, { color: theme.good }]}>
                {MXN(totalSavings)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: `${theme.bad}22` }]}>
                <DesignIcon.TrendDown size={18} color={theme.bad} strokeWidth={1.8} />
              </View>
              <Text style={[styles.summaryLabel, { color: theme.textTer }]}>Deuda pendiente</Text>
              <Text style={[styles.summaryValue, { color: theme.bad }]}>
                {MXN(totalDebt)}
              </Text>
            </View>
          </View>
          {monthlyNeeded > 0 && (
            <View style={[styles.monthlyNeeded, { borderTopColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={16} color={accent} />
              <Text style={[styles.monthlyNeededText, { color: accent }]}>
                Necesitas {MXN(monthlyNeeded)}/mes para cumplir tus metas
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <DesignIcon.Wallet size={18} color={theme.good} strokeWidth={1.6} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Metas de Ahorro</Text>
            </View>
            <View style={[styles.sectionCount, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.sectionCountText, { color: theme.textSec }]}>{savingsGoals.length}</Text>
            </View>
          </View>

          {savingsGoals.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DesignIcon.Envelope size={48} color={theme.textTer} strokeWidth={1.4} />
              <Text style={[styles.emptyText, { color: theme.textSec }]}>No tienes metas de ahorro</Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: accent }]}
                onPress={() => router.push("/objectives/add")}
              >
                <Text style={styles.emptyButtonText}>Crear meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savingsGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.objectiveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/objectives/edit/${goal.id}`)}
              >
                <View style={styles.objectiveHeader}>
                  <Text style={[styles.objectiveTitle, { color: theme.text }]}>{goal.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${theme.good}22` }]}>
                    <Text style={[styles.typeBadgeText, { color: theme.good }]}>Ahorro</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
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
                  <Text style={[styles.progressText, { color: theme.textSec }]}>
                    {(goal.progress || 0).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.objectiveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textTer }]}>Actual:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{MXN(goal.current_amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textTer }]}>Meta:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{MXN(goal.amount)}</Text>
                  </View>
                  {goal.monthlyPayment && goal.monthlyPayment > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textTer }]}>Ahorro mensual:</Text>
                      <Text style={[styles.detailValue, { color: accent }]}>{MXN(goal.monthlyPayment)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <DesignIcon.Card size={18} color={theme.bad} strokeWidth={1.6} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Deudas</Text>
            </View>
            <View style={[styles.sectionCount, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.sectionCountText, { color: theme.textSec }]}>{debts.length}</Text>
            </View>
          </View>

          {debts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DesignIcon.Check size={48} color={theme.good} strokeWidth={1.4} />
              <Text style={[styles.emptyText, { color: theme.text }]}>Sin deudas pendientes</Text>
              <Text style={[styles.emptySubtext, { color: theme.textTer }]}>Excelente trabajo</Text>
            </View>
          ) : (
            debts.map((debt) => (
              <TouchableOpacity
                key={debt.id}
                style={[styles.objectiveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/objectives/edit/${debt.id}`)}
              >
                <View style={styles.objectiveHeader}>
                  <Text style={[styles.objectiveTitle, { color: theme.text }]}>{debt.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${theme.bad}22` }]}>
                    <Text style={[styles.typeBadgeText, { color: theme.bad }]}>Deuda</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
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
                  <Text style={[styles.progressText, { color: theme.textSec }]}>
                    {(debt.progress || 0).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.objectiveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textTer }]}>Pagado:</Text>
                    <Text style={[styles.detailValue, { color: theme.good }]}>{MXN(debt.current_amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textTer }]}>Total deuda:</Text>
                    <Text style={[styles.detailValue, { color: theme.bad }]}>{MXN(debt.amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textTer }]}>Restante:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{MXN(debt.remaining || 0)}</Text>
                  </View>
                  {debt.monthlyPayment && debt.monthlyPayment > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textTer }]}>Pago mensual:</Text>
                      <Text style={[styles.detailValue, { color: accent }]}>{MXN(debt.monthlyPayment)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={() => router.push("/objectives/add")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  addButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  summaryCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  summaryTitle: { fontSize: 13, fontWeight: "600", marginBottom: 12 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryLabel: { fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  summaryDivider: { width: 1, height: 48, marginHorizontal: 16 },
  monthlyNeeded: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    gap: 8,
  },
  monthlyNeededText: { fontSize: 13, fontWeight: "500" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  sectionCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sectionCountText: { fontSize: 12, fontWeight: "600" },
  emptyState: { borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1 },
  emptyText: { fontSize: 14, marginTop: 12 },
  emptySubtext: { fontSize: 13, marginTop: 4 },
  emptyButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  objectiveCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  objectiveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  objectiveTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", minWidth: 40, textAlign: "right" },
  objectiveDetails: { gap: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});