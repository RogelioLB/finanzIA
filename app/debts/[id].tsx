import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { MXN, MXN_decimal } from '@/theme/format';
import { useWallets } from '@/contexts/WalletsContext';
import { useObjectives } from '@/contexts/ObjectivesContext';
import { Objective } from '@/contexts/ObjectivesContext';

interface PaymentPlanEntry {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const { wallets } = useWallets();
  const { objectives } = useObjectives();

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const wallet = useMemo(() => wallets.find(w => w.id === id), [wallets, id]);
  const objective = useMemo(() => objectives.find(o => o.id === id), [objectives, id]);

  const debt = useMemo(() => {
    if (wallet && wallet.type === 'credit') {
      const balance = wallet.net_balance ?? wallet.balance;
      const limit = wallet.credit_limit || balance * 1.5;
      return {
        id: wallet.id,
        name: wallet.name,
        type: 'wallet' as const,
        original: limit,
        paid: limit - balance,
        remaining: balance,
        apr: wallet.interest_rate || 0,
        monthly: 1500,
        color: wallet.color || accent,
      };
    }
    if (objective && objective.type === 'debt') {
      return {
        id: objective.id,
        name: objective.title,
        type: 'objective' as const,
        original: objective.amount,
        paid: objective.current_amount,
        remaining: objective.amount - objective.current_amount,
        apr: 0,
        monthly: 1000,
        color: accent,
      };
    }
    return null;
  }, [wallet, objective]);

  const paymentPlan = useMemo<PaymentPlanEntry[]>(() => {
    if (!debt || debt.remaining <= 0) return [];
    const plan: PaymentPlanEntry[] = [];
    const monthlyRate = debt.apr / 100 / 12;
    let remaining = debt.remaining;
    const startDate = new Date();

    for (let i = 0; i < 12 && remaining > 0; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const interest = remaining * monthlyRate;
      const principal = Math.min(debt.monthly - interest, remaining);
      remaining = Math.max(0, remaining - principal);

      plan.push({
        month: monthDate.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        payment: principal + interest,
        principal,
        interest,
        remaining,
      });
    }
    return plan;
  }, [debt]);

  const totalPaid = debt ? debt.paid : 0;
  const totalRemaining = debt ? debt.remaining : 0;
  const progressPct = debt && debt.original > 0 ? (debt.paid / debt.original) * 100 : 0;

  if (!debt) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: pad, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 24, color: theme.text, fontWeight: '600' }}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Deuda no encontrada</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: theme.textSec }}>Esta deuda ya no existe o no es válida.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: accent }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: pad, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.text, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{debt.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.heroCard, { marginHorizontal: pad, marginTop: 20, backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 24, padding: compact ? 18 : 22, borderWidth: 1 }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: debt.color + '22' }]}>
              <Text style={{ fontSize: 24 }}>💳</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: theme.text }]}>{debt.name}</Text>
              <Text style={[styles.heroRate, { color: theme.textSec }]}>APR {debt.apr}%</Text>
            </View>
          </View>

          <Text style={[styles.heroValue, { color: theme.text }]}>{MXN(totalRemaining)}</Text>
          <Text style={[styles.heroGain, { color: theme.textSec }]}>
            {MXN(totalPaid)} pagado de {MXN(debt.original)}
          </Text>

          <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 4, marginTop: 14 }]}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: debt.color, borderRadius: 4 }]} />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textSec, marginTop: 8 }]}>
            {Math.round(progressPct)}% pagado
          </Text>
        </View>

        <View style={[styles.statsGrid, { marginHorizontal: pad, marginTop: 16, gap: 10 }]}>
          {[
            { label: 'Pago mensual', value: MXN(debt.monthly) },
            { label: 'Total original', value: MXN(debt.original) },
            { label: 'Pagado hasta hoy', value: MXN(totalPaid) },
            { label: 'Restante', value: MXN(totalRemaining) },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, padding: compact ? 12 : 14, borderWidth: 1, flex: 1 }]}>
              <Text style={[styles.statLabel, { color: theme.textTer }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {paymentPlan.length > 0 && (
          <View style={[styles.planSection, { marginHorizontal: pad, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>PLAN DE PAGOS (12 MESES)</Text>
            <View style={[styles.planTable, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, marginTop: 8, borderWidth: 1, overflow: 'hidden' }]}>
              <View style={[styles.planHeader, { borderBottomWidth: 1, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.planColLabel, { color: theme.textSec, flex: 1 }]}>Mes</Text>
                <Text style={[styles.planColLabel, { color: theme.textSec, flex: 1, textAlign: 'right' }]}>Pago</Text>
                <Text style={[styles.planColLabel, { color: theme.textSec, flex: 1, textAlign: 'right' }]}>Capital</Text>
                <Text style={[styles.planColLabel, { color: theme.textSec, flex: 1, textAlign: 'right' }]}>Saldo</Text>
              </View>
              {paymentPlan.map((entry, i) => (
                <View key={entry.month} style={[styles.planRow, { borderBottomWidth: i < paymentPlan.length - 1 ? 0.5 : 0, borderColor: theme.border }]}>
                  <Text style={[styles.planMonth, { color: theme.text, flex: 1 }]}>{entry.month}</Text>
                  <Text style={[styles.planValue, { color: theme.text, flex: 1, textAlign: 'right' }]}>{MXN(entry.payment)}</Text>
                  <Text style={[styles.planValue, { color: theme.good, flex: 1, textAlign: 'right' }]}>{MXN(entry.principal)}</Text>
                  <Text style={[styles.planValue, { color: theme.textSec, flex: 1, textAlign: 'right' }]}>{MXN(entry.remaining)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {debt.type === 'objective' && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Eliminar deuda',
                '¿Estás seguro de eliminar esta deuda?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      router.back();
                    },
                  },
                ]
              );
            }}
            style={[styles.deleteBtn, { marginHorizontal: pad, marginTop: 24, borderColor: theme.bad + '44', borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center' }]}
          >
            <Text style={{ fontSize: 18 }}>🗑</Text>
            <Text style={[styles.deleteBtnText, { color: theme.bad, marginLeft: 8 }]}>Eliminar deuda</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  scrollView: { flex: 1 },
  heroCard: {},
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '600' },
  heroRate: { fontSize: 13, marginTop: 2 },
  heroValue: { fontSize: 32, fontWeight: '600', letterSpacing: -1.2, marginTop: 16 },
  heroGain: { fontSize: 13, marginTop: 4 },
  progressBar: { height: 8, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressLabel: { fontSize: 12, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: {},
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  planSection: {},
  sectionTitle: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  planTable: {},
  planHeader: { flexDirection: 'row' },
  planColLabel: { fontSize: 11, fontWeight: '500' },
  planRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11 },
  planMonth: { fontSize: 13 },
  planValue: { fontSize: 13 },
  deleteBtn: { flexDirection: 'row', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500' },
});