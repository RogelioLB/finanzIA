import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useWallets } from '@/contexts/WalletsContext';
import { useObjectives } from '@/contexts/ObjectivesContext';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN } from '@/theme/format';

export default function DebtsScreen() {
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const { wallets, refreshWallets } = useWallets();
  const { objectives, refreshObjectives } = useObjectives();

  useFocusEffect(
    useCallback(() => {
      refreshWallets();
      refreshObjectives();
    }, [refreshWallets, refreshObjectives])
  );

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const creditWallets = wallets.filter(w => w.type === 'credit');
  const debtObjectives = objectives.filter(o => o.type === 'debt' && !o.is_archived);

  const debts = useMemo(() => {
    const items: any[] = [];
    creditWallets.forEach(w => {
      const balance = w.net_balance ?? w.balance;
      if (balance > 0) {
        items.push({
          id: w.id,
          name: w.name,
          original: w.credit_limit || balance * 1.5,
          paid: (w.credit_limit || balance * 1.5) - balance,
          remaining: balance,
          monthly: 1500,
          due: '2026',
          apr: `${w.interest_rate || 0}%`,
          type: 'wallet',
        });
      }
    });
    debtObjectives.forEach(o => {
      items.push({
        id: o.id,
        name: o.title,
        original: o.amount,
        paid: o.current_amount,
        remaining: o.amount - o.current_amount,
        monthly: 1000,
        due: o.due_date ? new Date(o.due_date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }) : 'N/A',
        apr: '0%',
        type: 'objective',
      });
    });
    return items;
  }, [creditWallets, debtObjectives]);

  const totalOriginal = debts.reduce((s, d) => s + d.original, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0);
  const totalRemaining = totalOriginal - totalPaid;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.header, { paddingHorizontal: pad, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Deudas</Text>
            <Text style={[styles.subtitle, { color: theme.textSec }]}>
              {debts.length} activas{totalOriginal > 0 ? ` · ${Math.round(totalPaid / totalOriginal * 100)}% pagado` : ''}
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

        <View style={[styles.totalCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: 20, padding: compact ? 16 : 20, borderRadius: 22 }]}>
          <Text style={[styles.totalLabel, { color: theme.textSec }]}>TOTAL RESTANTE</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>{MXN(totalRemaining)}</Text>
          <View style={styles.totalMeta}>
            <Text style={[styles.totalMetaText, { color: theme.textTer }]}>Pagado {MXN(totalPaid)}</Text>
            <Text style={[styles.totalMetaText, { color: theme.textTer }]}>Total {MXN(totalOriginal)}</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 2, marginTop: 12 }]}>
            <View style={[styles.progressFill, { width: `${totalPaid / totalOriginal * 100}%`, backgroundColor: accent, borderRadius: 2 }]} />
          </View>
        </View>

        <View style={[styles.debtsList, { paddingHorizontal: pad, gap: 10 }]}>
          {debts.map((debt) => (
            <TouchableOpacity
              key={debt.id}
              onPress={() => { (router as any).push('/debts/' + debt.id); }}
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
                  <View style={[styles.miniProgressFill, { width: `${(debt.paid / debt.original) * 100}%`, backgroundColor: accent, borderRadius: 3 }]} />
                </View>
                <View style={[styles.debtStats, { marginTop: 6 }]}>
                  <Text style={[styles.debtPct, { color: theme.textSec }]}>{Math.round(debt.paid / debt.original * 100)}% pagado</Text>
                  <Text style={[styles.debtMonthly, { color: theme.textSec }]}>{MXN(debt.monthly)}/mes</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {debts.length === 0 && (
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