import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useCreditCards, CreditInstallment } from "@/contexts/CreditCardsContext";
import { PeriodInfo } from "@/lib/database/creditCardService";
import { DesignIcon } from "@/components/ui/Icon";
import { MXN } from "@/theme/format";
import { Toast } from "@/components/ui/Toast";

export default function CreditCardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, accent, density } = useTheme();
  const {
    getCreditCardById,
    installmentsByCard,
    markInstallmentPaid,
    deleteInstallment,
    getPeriodInfo,
    refreshCreditCards,
  } = useCreditCards();

  const card = getCreditCardById(id);
  const installments: CreditInstallment[] = installmentsByCard[id] || [];
  const [periodInfo, setPeriodInfo] = useState<PeriodInfo | null>(null);

  const compact = density === "compact";
  const pad = compact ? 16 : 20;

  const loadPeriod = useCallback(async () => {
    const info = await getPeriodInfo(id);
    setPeriodInfo(info);
  }, [getPeriodInfo, id]);

  useFocusEffect(
    useCallback(() => {
      refreshCreditCards();
      loadPeriod();
    }, [refreshCreditCards, loadPeriod])
  );

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  if (!card) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={["top"]}>
        <View style={styles.notFound}>
          <DesignIcon.Card size={64} color={theme.textTer} strokeWidth={1} />
          <Text style={[styles.notFoundText, { color: theme.textSec }]}>
            Tarjeta no encontrada
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: accent }}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Two-horizon calculations
  const activeInstallments = installments.filter(
    (i) => i.paid_installments < i.total_installments
  );
  const installmentsThisMonth = activeInstallments.reduce(
    (s, i) => s + i.monthly_amount,
    0
  );
  const installmentsFuture = activeInstallments.reduce(
    (s, i) => s + (i.total_installments - i.paid_installments - 1) * i.monthly_amount,
    0
  );
  const periodCharges = periodInfo?.periodCharges ?? 0;
  const thisMonthTotal = periodCharges + card.previous_balance + installmentsThisMonth;
  const futureMonthsTotal = installmentsFuture;

  const nextCutOff = card.next_cut_off_date;
  const nextCutOffStr = nextCutOff
    ? nextCutOff.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    : "";

  const handleMarkPaid = (installment: CreditInstallment) => {
    const next = installment.paid_installments + 1;
    Alert.alert(
      "Marcar cuota pagada",
      `¿Confirmar pago de cuota ${next}/${installment.total_installments} de "${installment.title}" por ${MXN(installment.monthly_amount)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await markInstallmentPaid(installment.id, id);
              await loadPeriod();
              Toast.success("Cuota registrada", `Cuota ${next}/${installment.total_installments} marcada como pagada.`);
            } catch {
              Toast.error("Error", "No se pudo registrar el pago.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteInstallment = (installment: CreditInstallment) => {
    Alert.alert(
      "Eliminar compra a meses",
      `¿Eliminar "${installment.title}"? Se borrará el registro pero no las transacciones ya creadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInstallment(installment.id, id);
              Toast.success("Eliminado", "Compra a meses eliminada.");
            } catch {
              Toast.error("Error", "No se pudo eliminar.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header row */}
        <View style={[styles.headerRow, { paddingHorizontal: pad, paddingTop: 8, marginBottom: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <DesignIcon.Back size={22} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>
            {card.name}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/credit-cards/edit/${id}` as any)}
            style={styles.editBtn}
          >
            <DesignIcon.Settings size={20} color={theme.textSec} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Card visual */}
        <View style={[styles.cardPreview, { backgroundColor: card.color || "#1E3A8A", shadowColor: card.color || "#1E3A8A", marginHorizontal: pad, marginBottom: 20 }]}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardBank}>{(card.bank || "BANCO").toUpperCase()}</Text>
              <Text style={styles.cardName}>{card.name}</Text>
            </View>
            <DesignIcon.Card size={26} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
          </View>
          <Text style={styles.cardNumber}>
            {`••••  ••••  ••••  ${card.last_four_digits || "••••"}`}
          </Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>DISPONIBLE</Text>
              <Text style={styles.cardValue}>
                {MXN(Math.max(0, card.credit_limit - card.current_balance))}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>LÍMITE</Text>
              <Text style={styles.cardValue}>{MXN(card.credit_limit)}</Text>
            </View>
          </View>
        </View>

        {/* Two-horizon summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: 20, padding: compact ? 14 : 18 }]}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: theme.textSec }]}>A PAGAR ESTE MES</Text>
              <Text style={[styles.summaryAmount, { color: theme.text }]}>{MXN(Math.max(0, thisMonthTotal))}</Text>
              {nextCutOffStr ? (
                <Text style={[styles.summaryDue, { color: theme.textTer }]}>vence {nextCutOffStr}</Text>
              ) : null}
            </View>
            {futureMonthsTotal > 0 && (
              <View style={{ alignItems: "flex-end", flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: theme.textSec }]}>PRÓXIMOS MESES</Text>
                <Text style={[styles.summaryAmountSmall, { color: theme.textSec }]}>{MXN(futureMonthsTotal)}</Text>
                <Text style={[styles.summaryDue, { color: theme.textTer }]}>en cuotas futuras</Text>
              </View>
            )}
          </View>

          {/* Breakdown */}
          <View style={[styles.breakdownSep, { backgroundColor: theme.border }]} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.textTer }]}>Cargos del ciclo</Text>
            <Text style={[styles.breakdownVal, { color: theme.textSec }]}>{MXN(Math.max(0, periodCharges))}</Text>
          </View>
          {card.previous_balance > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.textTer }]}>Deuda anterior</Text>
              <Text style={[styles.breakdownVal, { color: theme.textSec }]}>{MXN(card.previous_balance)}</Text>
            </View>
          )}
          {installmentsThisMonth > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.textTer }]}>Cuotas MSI ({activeInstallments.length})</Text>
              <Text style={[styles.breakdownVal, { color: theme.textSec }]}>{MXN(installmentsThisMonth)}/mes</Text>
            </View>
          )}
        </View>

        {/* Installments section */}
        <View style={{ paddingHorizontal: pad }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Compras a meses</Text>
            <TouchableOpacity
              onPress={() => router.push(`/credit-cards/installments/add?walletId=${id}` as any)}
              style={[styles.addBtn, { backgroundColor: accent }]}
              activeOpacity={0.85}
            >
              <DesignIcon.Plus size={14} color="#fff" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {installments.length === 0 ? (
            <View style={[styles.emptyInstallments, { borderColor: theme.border }]}>
              <Text style={[styles.emptyText, { color: theme.textTer }]}>
                Sin compras a meses registradas
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {installments.map((inst) => {
                const isComplete = inst.paid_installments >= inst.total_installments;
                const currentCuota = inst.paid_installments + 1;
                return (
                  <View
                    key={inst.id}
                    style={[
                      styles.installmentCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isComplete ? theme.good || accent : theme.border,
                        padding: compact ? 12 : 14,
                      },
                    ]}
                  >
                    <View style={styles.instHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.instTitle, { color: theme.text }]} numberOfLines={1}>
                          {inst.title}
                        </Text>
                        {inst.store ? (
                          <Text style={[styles.instStore, { color: theme.textTer }]}>
                            {inst.store}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.instAmount, { color: theme.text }]}>
                          {MXN(inst.monthly_amount)}/mes
                        </Text>
                        <Text style={[styles.instProgress, { color: isComplete ? (theme.good || accent) : theme.textSec }]}>
                          {isComplete ? "Completado" : `Cuota ${currentCuota} de ${inst.total_installments}`}
                        </Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={[styles.instProgressBar, { backgroundColor: theme.surfaceAlt, marginTop: 10 }]}>
                      <View
                        style={[
                          styles.instProgressFill,
                          {
                            width: `${(inst.paid_installments / inst.total_installments) * 100}%`,
                            backgroundColor: isComplete ? (theme.good || accent) : accent,
                          },
                        ]}
                      />
                    </View>

                    {!isComplete && (
                      <View style={[styles.instActions, { marginTop: 10 }]}>
                        <TouchableOpacity
                          onPress={() => handleMarkPaid(inst)}
                          style={[styles.payBtn, { backgroundColor: accent }]}
                          activeOpacity={0.85}
                        >
                          <DesignIcon.Check size={13} color="#fff" strokeWidth={2.5} />
                          <Text style={styles.payBtnText}>Marcar cuota pagada</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteInstallment(inst)}
                          style={[styles.deleteBtn, { borderColor: theme.border }]}
                          activeOpacity={0.7}
                        >
                          <DesignIcon.Minus size={14} color={theme.textTer} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {isComplete && (
                      <TouchableOpacity
                        onPress={() => handleDeleteInstallment(inst)}
                        style={[styles.deleteCompletedBtn, { marginTop: 8 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.deleteCompletedText, { color: theme.textTer }]}>
                          Eliminar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  notFoundText: { fontSize: 16, marginTop: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: { padding: 4 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: "600", letterSpacing: -0.4 },
  editBtn: { padding: 4 },
  cardPreview: {
    borderRadius: 18,
    padding: 18,
    minHeight: 150,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardBank: { fontSize: 11, color: "rgba(255,255,255,0.75)", letterSpacing: 0.5, fontWeight: "500" },
  cardName: { fontSize: 16, color: "#fff", fontWeight: "600", marginTop: 2 },
  cardNumber: { fontSize: 18, fontWeight: "500", letterSpacing: 4, color: "#fff", marginTop: 22 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  cardLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5, fontWeight: "500" },
  cardValue: { fontSize: 12, color: "#fff", fontWeight: "500", marginTop: 1 },
  summaryCard: { borderRadius: 18, borderWidth: 1 },
  summaryRow: { flexDirection: "row", alignItems: "flex-start" },
  summaryLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: "600", letterSpacing: -1 },
  summaryAmountSmall: { fontSize: 20, fontWeight: "600", letterSpacing: -0.5 },
  summaryDue: { fontSize: 11, marginTop: 2 },
  breakdownSep: { height: 1, marginVertical: 12 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  breakdownLabel: { fontSize: 12 },
  breakdownVal: { fontSize: 12, fontVariant: ["tabular-nums"] },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyInstallments: { borderWidth: 1, borderStyle: "dashed", borderRadius: 14, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 13 },
  installmentCard: { borderRadius: 16, borderWidth: 1 },
  instHeader: { flexDirection: "row", alignItems: "flex-start" },
  instTitle: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2 },
  instStore: { fontSize: 11, marginTop: 2 },
  instAmount: { fontSize: 14, fontWeight: "600", letterSpacing: -0.3 },
  instProgress: { fontSize: 11, marginTop: 2 },
  instProgressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  instProgressFill: { height: "100%" },
  instActions: { flexDirection: "row", gap: 8 },
  payBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  payBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  deleteCompletedBtn: { alignSelf: "flex-end" },
  deleteCompletedText: { fontSize: 11 },
});
