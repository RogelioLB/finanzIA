import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useObjectives } from '@/contexts/ObjectivesContext';
import { useCreditCards } from '@/contexts/CreditCardsContext';
import { PeriodInfo } from '@/lib/database/creditCardService';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN } from '@/theme/format';

export default function DebtsScreen() {
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const { objectives, refreshObjectives } = useObjectives();
  const {
    creditCards,
    installmentsByCard,
    getPeriodInfo,
    refreshCreditCards,
  } = useCreditCards();

  const [periodInfoMap, setPeriodInfoMap] = useState<Record<string, PeriodInfo>>({});

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const loadPeriods = useCallback(async () => {
    const map: Record<string, PeriodInfo> = {};
    for (const card of creditCards) {
      const info = await getPeriodInfo(card.id);
      if (info) map[card.id] = info;
    }
    setPeriodInfoMap(map);
  }, [creditCards, getPeriodInfo]);

  useFocusEffect(
    useCallback(() => {
      refreshCreditCards();
      refreshObjectives();
    }, [refreshCreditCards, refreshObjectives])
  );

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const debtObjectives = objectives.filter(o => o.type === 'debt' && !o.is_archived);

  const debtItems = useMemo(() => {
    return debtObjectives.map(o => ({
      id: o.id,
      name: o.title,
      original: o.amount,
      paid: o.current_amount,
      remaining: o.amount - o.current_amount,
      monthly: 1000,
      due: o.due_date
        ? new Date(o.due_date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
        : 'N/A',
      apr: '0%',
    }));
  }, [debtObjectives]);

  const totalOriginal = debtItems.reduce((s, d) => s + d.original, 0);
  const totalPaid = debtItems.reduce((s, d) => s + d.paid, 0);
  const totalRemaining = totalOriginal - totalPaid;

  // Credit card summary totals
  const creditCardsWithData = creditCards.filter(card => {
    const installments = installmentsByCard[card.id] || [];
    const periodInfo = periodInfoMap[card.id];
    const periodCharges = periodInfo?.periodCharges ?? 0;
    const activeInst = installments.filter(i => i.paid_installments < i.total_installments);
    return card.current_balance > 0 || card.previous_balance > 0 || activeInst.length > 0 || periodCharges > 0;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.header, { paddingHorizontal: pad, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Deudas</Text>
            <Text style={[styles.subtitle, { color: theme.textSec }]}>
              {debtItems.length + creditCardsWithData.length} activas{totalOriginal > 0 ? ` · ${Math.round(totalPaid / totalOriginal * 100)}% pagado` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/debts/pay')}
              style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
              activeOpacity={0.85}
            >
              <DesignIcon.Cash size={14} color="#fff" strokeWidth={2} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Pagar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/objectives/add-debt')}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.85}
            >
              <DesignIcon.Plus size={18} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Credit cards section ── */}
        {creditCardsWithData.length > 0 && (
          <View style={{ paddingHorizontal: pad, marginBottom: 24 }}>
            <Text style={[styles.sectionLabel, { color: theme.textSec, marginBottom: 10 }]}>TARJETAS DE CRÉDITO</Text>
            <View style={{ gap: 10 }}>
              {creditCardsWithData.map(card => {
                const installments = installmentsByCard[card.id] || [];
                const periodInfo = periodInfoMap[card.id];
                const periodCharges = periodInfo?.periodCharges ?? 0;
                const activeInst = installments.filter(i => i.paid_installments < i.total_installments);
                const instThisMonth = activeInst.reduce((s, i) => s + i.monthly_amount, 0);
                const instFuture = activeInst.reduce((s, i) => s + (i.total_installments - i.paid_installments - 1) * i.monthly_amount, 0);
                const thisMonthTotal = Math.max(0, periodCharges + card.previous_balance + instThisMonth);
                const nextCutOff = card.next_cut_off_date;
                const nextCutOffStr = nextCutOff
                  ? nextCutOff.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                  : '';

                return (
                  <TouchableOpacity
                    key={card.id}
                    onPress={() => router.push(`/credit-cards/${card.id}` as any)}
                    style={[styles.creditCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: compact ? 14 : 16 }]}
                    activeOpacity={0.85}
                  >
                    {/* Card header */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={[styles.cardDot, { backgroundColor: card.color || accent }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{card.name}</Text>
                          {card.last_four_digits ? (
                            <Text style={[styles.cardLast4, { color: theme.textTer }]}>••• {card.last_four_digits}</Text>
                          ) : null}
                        </View>
                      </View>
                      <DesignIcon.Chevron size={16} color={theme.textTer} strokeWidth={2} />
                    </View>

                    {/* This month */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <View>
                        <Text style={[styles.horizonLabel, { color: theme.textTer }]}>A PAGAR ESTE MES</Text>
                        <Text style={[styles.horizonAmount, { color: theme.text }]}>{MXN(thisMonthTotal)}</Text>
                        {nextCutOffStr ? (
                          <Text style={[styles.horizonDue, { color: theme.textTer }]}>vence {nextCutOffStr}</Text>
                        ) : null}
                      </View>
                      {instFuture > 0 && (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.horizonLabel, { color: theme.textTer }]}>PRÓXIMOS MESES</Text>
                          <Text style={[styles.horizonAmountSmall, { color: theme.textSec }]}>{MXN(instFuture)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Breakdown chips */}
                    {(card.previous_balance > 0 || activeInst.length > 0) && (
                      <View style={[styles.chipsRow, { marginTop: 10 }]}>
                        {card.previous_balance > 0 && (
                          <View style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
                            <Text style={[styles.chipText, { color: theme.textTer }]}>
                              Deuda ant. {MXN(card.previous_balance)}
                            </Text>
                          </View>
                        )}
                        {activeInst.map(i => (
                          <View key={i.id} style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}>
                            <Text style={[styles.chipText, { color: theme.textTer }]} numberOfLines={1}>
                              {`${i.title} C.${i.paid_installments + 1}/${i.total_installments}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Debt objectives summary ── */}
        {debtItems.length > 0 && (
          <>
            <View style={[styles.totalCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: 20, padding: compact ? 16 : 20, borderRadius: 22 }]}>
              <Text style={[styles.totalLabel, { color: theme.textSec }]}>TOTAL OBJETIVOS DE DEUDA</Text>
              <Text style={[styles.totalAmount, { color: theme.text }]}>{MXN(totalRemaining)}</Text>
              <View style={styles.totalMeta}>
                <Text style={[styles.totalMetaText, { color: theme.textTer }]}>Pagado {MXN(totalPaid)}</Text>
                <Text style={[styles.totalMetaText, { color: theme.textTer }]}>Total {MXN(totalOriginal)}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 2, marginTop: 12 }]}>
                <View style={[styles.progressFill, { width: `${totalOriginal > 0 ? totalPaid / totalOriginal * 100 : 0}%`, backgroundColor: accent, borderRadius: 2 }]} />
              </View>
            </View>

            <View style={[styles.debtsList, { paddingHorizontal: pad, gap: 10 }]}>
              {debtItems.map((debt) => (
                <TouchableOpacity
                  key={debt.id}
                  onPress={() => (router as any).push('/debts/' + debt.id)}
                  style={[styles.debtCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: compact ? 14 : 16, borderRadius: 20, borderWidth: 1 }]}
                >
                  <View style={styles.debtHeader}>
                    <View>
                      <Text style={[styles.debtName, { color: theme.text }]}>{debt.name}</Text>
                      <Text style={[styles.debtMeta, { color: theme.textTer }]}>APR {debt.apr} · liquida en {debt.due}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.debtRemaining, { color: theme.text }]}>{MXN(debt.remaining)}</Text>
                      <Text style={[styles.debtRemainingLabel, { color: theme.textTer }]}>restante</Text>
                    </View>
                  </View>
                  <View style={[styles.debtProgress, { marginTop: 10 }]}>
                    <View style={[styles.miniProgressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 3 }]}>
                      <View style={[styles.miniProgressFill, { width: `${debt.original > 0 ? (debt.paid / debt.original) * 100 : 0}%`, backgroundColor: accent, borderRadius: 3 }]} />
                    </View>
                    <View style={[styles.debtStats, { marginTop: 6 }]}>
                      <Text style={[styles.debtPct, { color: theme.textSec }]}>{debt.original > 0 ? Math.round(debt.paid / debt.original * 100) : 0}% pagado</Text>
                      <Text style={[styles.debtMonthly, { color: theme.textSec }]}>{MXN(debt.monthly)}/mes</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {debtItems.length === 0 && creditCardsWithData.length === 0 && (
          <View style={[styles.empty, { padding: 40, alignItems: 'center' }]}>
            <DesignIcon.Debt size={48} color={theme.textTer} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text, marginTop: 16 }]}>Sin deudas</Text>
            <Text style={[styles.emptySub, { color: theme.textTer, marginTop: 8 }]}>No tienes deudas registradas</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: {},
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -1.2, marginBottom: 4 },
  subtitle: { fontSize: 13 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.5, fontWeight: '600' },
  creditCard: { borderRadius: 20, borderWidth: 1 },
  cardDot: { width: 10, height: 10, borderRadius: 5 },
  cardName: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  cardLast4: { fontSize: 11, marginTop: 1 },
  horizonLabel: { fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  horizonAmount: { fontSize: 22, fontWeight: '600', letterSpacing: -0.8 },
  horizonAmountSmall: { fontSize: 16, fontWeight: '600', letterSpacing: -0.5 },
  horizonDue: { fontSize: 10, marginTop: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10 },
  totalCard: { borderWidth: 1 },
  totalLabel: { fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  totalAmount: { fontSize: 36, fontWeight: '600', letterSpacing: -1.4, marginBottom: 12 },
  totalMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  totalMetaText: { fontSize: 11 },
  progressBar: { height: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  debtsList: {},
  debtCard: {},
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  debtName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  debtMeta: { fontSize: 11, marginTop: 2 },
  debtRemaining: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  debtRemainingLabel: { fontSize: 11, marginTop: 2 },
  debtProgress: {},
  miniProgressBar: { height: 5, overflow: 'hidden' },
  miniProgressFill: { height: '100%' },
  debtStats: { flexDirection: 'row', justifyContent: 'space-between' },
  debtPct: { fontSize: 11 },
  debtMonthly: { fontSize: 11 },
  empty: {},
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySub: { fontSize: 14 },
});
