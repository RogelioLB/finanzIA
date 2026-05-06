import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useObjectives } from '@/contexts/ObjectivesContext';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { useInvestments } from '@/contexts/InvestmentsContext';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN_decimal, MXN } from '@/theme/format';
import { Subscription } from '@/lib/models/types';
import QuickPaySheet from '@/components/sheets/QuickPaySheet';

function CategoryIcon({ name, size, color }: { name?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  const n = (name || '').toLowerCase();
  if (n.includes('comida') || n.includes('restaurante') || n.includes('food')) return <DesignIcon.Food {...props} />;
  if (n.includes('transporte') || n.includes('auto') || n.includes('uber')) return <DesignIcon.Transport {...props} />;
  if (n.includes('entrete') || n.includes('ocio') || n.includes('fun')) return <DesignIcon.Fun {...props} />;
  if (n.includes('compra') || n.includes('ropa') || n.includes('tienda')) return <DesignIcon.Bag {...props} />;
  if (n.includes('servicio') || n.includes('luz') || n.includes('electric')) return <DesignIcon.Bolt {...props} />;
  if (n.includes('salud') || n.includes('médico') || n.includes('farmac')) return <DesignIcon.Health {...props} />;
  if (n.includes('casa') || n.includes('rent') || n.includes('hogar')) return <DesignIcon.Home2 {...props} />;
  if (n.includes('educ') || n.includes('escuela') || n.includes('curso')) return <DesignIcon.Education {...props} />;
  if (n.includes('mascot') || n.includes('pet')) return <DesignIcon.Pet {...props} />;
  if (n.includes('salario') || n.includes('sueldo') || n.includes('pago')) return <DesignIcon.Cash {...props} />;
  if (n.includes('freelance') || n.includes('trabajo') || n.includes('proyecto')) return <DesignIcon.Phone {...props} />;
  if (n.includes('inversi') || n.includes('bolsa') || n.includes('acciones')) return <DesignIcon.TrendUp {...props} />;
  if (n.includes('regalo') || n.includes('gift')) return <DesignIcon.Health {...props} />;
  if (n.includes('reembolso') || n.includes('devoluci')) return <DesignIcon.Cash {...props} />;
  return <DesignIcon.List {...props} />;
}

function WalletIcon({ type, size, color }: { type?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  return type === 'credit' ? <DesignIcon.Card {...props} /> : <DesignIcon.Wallet {...props} />;
}

export default function HomeScreen() {
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const { userName } = useUser();
  const { wallets } = useWallets();
  const { transactions } = useTransactions();
  const { objectives } = useObjectives();
  const { subscriptions } = useSubscriptions();
  const { totalValue: investmentsTotal, totalGain: investmentsGain, gainPct: investmentsGainPct } = useInvestments();

  const [quickPaySub, setQuickPaySub] = useState<Subscription | null>(null);
  const [showQuickPay, setShowQuickPay] = useState(false);

  const subsMap = useMemo(() => {
    const map: Record<string, Subscription> = {};
    subscriptions.forEach(s => { map[s.name.toLowerCase()] = s; });
    return map;
  }, [subscriptions]);

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const netWorth = useMemo(() => {
    const walletsSum = wallets.reduce((sum, w) => {
      const balance = w.net_balance ?? w.balance;
      return sum + (w.type === 'credit' ? -balance : balance);
    }, 0);
    return walletsSum + investmentsTotal;
  }, [wallets, investmentsTotal]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const monthSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.timestamp >= startOfMonth && t.timestamp <= endOfMonth && !t.is_excluded)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, startOfMonth, endOfMonth]);

  const prevMonthSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.timestamp >= startOfPrevMonth && t.timestamp < startOfMonth && !t.is_excluded)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, startOfPrevMonth, startOfMonth]);

  const netWorthDisplay = MXN_decimal(netWorth);
  const netWorthParts = netWorthDisplay.replace('−', '').replace('$', '').split('.');
  const monthDelta = monthSpent - prevMonthSpent;

  const savingsGoals = useMemo(() => objectives.filter(o => o.type === 'savings' && !o.is_archived), [objectives]);
  const debtObjectives = useMemo(() => objectives.filter(o => o.type === 'debt' && !o.is_archived), [objectives]);
  const creditWallets = useMemo(() => wallets.filter(w => w.type === 'credit' && (w.net_balance ?? w.balance) > 0), [wallets]);

  const totalSavings = useMemo(() => savingsGoals.reduce((s, o) => s + o.current_amount, 0), [savingsGoals]);
  const totalDebts = useMemo(() => {
    const fromObjectives = debtObjectives.reduce((s, o) => s + (o.amount - o.current_amount), 0);
    const fromCredit = creditWallets.reduce((s, w) => s + (w.net_balance ?? w.balance), 0);
    return fromObjectives + fromCredit;
  }, [debtObjectives, creditWallets]);

  const monthName = new Date().toLocaleDateString('es-MX', { month: 'long' });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentYear = now.getFullYear();

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => !t.is_excluded)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [transactions]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getTimeLabel = (timestamp: number) => {
    const today = new Date();
    const txDate = new Date(timestamp);
    const diffDays = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return txDate.toLocaleDateString('es-MX', { weekday: 'short' });
    return txDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.header, { paddingHorizontal: pad, paddingBottom: compact ? 18 : 24 }]}>
          <View>
            <Text style={[styles.greetingLabel, { color: theme.textSec }]}>{getGreeting()}, {userName || 'Usuario'}</Text>
            <Text style={[styles.monthLabel, { color: theme.textTer }]}>{monthNameCapitalized} {currentYear}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/settings')}
          >
            <DesignIcon.Settings size={16} color={theme.text} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Cuentas horizontales */}
        {wallets.length > 0 && (
          <View style={{ marginBottom: compact ? 16 : 20 }}>
            <View style={[styles.sectionHeader, { paddingHorizontal: pad, marginBottom: 10 }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Mis cuentas</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/more')}>
                <Text style={[styles.seeAll, { color: accent }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: pad, gap: 10 }}
            >
              {wallets.map((w) => {
                const bal = w.net_balance ?? w.balance;
                const isCredit = w.type === 'credit';
                const cardColor = w.color || accent;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.walletCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderLeftColor: cardColor,
                        borderLeftWidth: 3,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.walletCardTop}>
                      <View style={[styles.walletIconBox, { backgroundColor: `${cardColor}18` }]}>
                        <WalletIcon type={w.type} size={20} color={cardColor} />
                      </View>
                      <View style={[styles.walletTypeBadge, { backgroundColor: isCredit ? `${theme.bad}18` : `${theme.good}18` }]}>
                        <Text style={{ fontSize: 9, color: isCredit ? theme.bad : theme.good, fontWeight: '600' }}>
                          {isCredit ? 'CRÉDITO' : 'DÉBITO'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.walletName, { color: theme.textSec }]} numberOfLines={1}>{w.name}</Text>
                    <Text style={[styles.walletBalance, { color: isCredit ? theme.bad : theme.text }]}>
                      {isCredit ? '−' : ''}{MXN(Math.abs(bal))}
                    </Text>
                    {isCredit && w.credit_limit ? (
                      <Text style={[styles.walletSub, { color: theme.textTer }]}>
                        Límite: {MXN(w.credit_limit)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.heroSection, { paddingHorizontal: pad, marginBottom: compact ? 22 : 32 }]}>
          <Text style={[styles.heroLabel, { color: theme.textSec }]}>SALDO NETO</Text>
          <View style={styles.heroAmount}>
            <Text style={[styles.heroInt, { color: theme.text, fontFamily: 'System' }]}>
              ${netWorthParts[0]}
            </Text>
            <Text style={[styles.heroDec, { color: theme.textTer, fontFamily: 'System' }]}>
              .{netWorthParts[1] || '00'}
            </Text>
          </View>
          <View style={styles.deltaRow}>
            {monthDelta >= 0 ? (
              <DesignIcon.TrendUp size={13} color={theme.bad} strokeWidth={2} />
            ) : (
              <DesignIcon.TrendDown size={13} color={theme.good} strokeWidth={2} />
            )}
            <Text style={[styles.deltaText, { color: monthDelta >= 0 ? theme.bad : theme.good }]}>
              {monthDelta >= 0 ? '+' : ''}{MXN(monthDelta)}
            </Text>
            <Text style={[styles.deltaLabel, { color: theme.textTer }]}>vs mes anterior</Text>
          </View>
        </View>

        <View style={[styles.monthCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: 12, padding: compact ? 14 : 18, borderRadius: 20 }]}>
          <View style={styles.monthCardHeader}>
            <Text style={[styles.monthCardTitle, { color: theme.textSec }]}>Gastado este mes</Text>
          </View>
          <View style={styles.monthCardRow}>
            <Text style={[styles.monthCardAmount, { color: theme.text }]}>{MXN(monthSpent)}</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 3 }]}>
            <View style={[styles.progressFill, { width: 0, backgroundColor: accent, borderRadius: 3 }]} />
          </View>
        </View>

        <View style={[styles.summaryGrid, { paddingHorizontal: pad, marginBottom: 12, gap: 10 }]}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 20, padding: 14 }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSec }]}>Ahorros</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{MXN(totalSavings)}</Text>
            <Text style={[styles.summaryHint, { color: theme.textTer }]}>{savingsGoals.length} metas activas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 20, padding: 14 }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSec }]}>Deudas</Text>
            <Text style={[styles.summaryValue, { color: totalDebts > 0 ? theme.bad : theme.text }]}>{MXN(totalDebts)}</Text>
            <Text style={[styles.summaryHint, { color: theme.textTer }]}>{debtObjectives.length + creditWallets.length} pendientes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.investmentCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: compact ? 18 : 24, padding: compact ? 14 : 16, borderRadius: 20 }]}
          onPress={() => router.push('/investments')}
        >
          <View style={[styles.investIconWrapper, { backgroundColor: investmentsGain >= 0 ? `${theme.good}18` : `${theme.bad}18` }]}>
            <DesignIcon.TrendUp size={16} color={investmentsGain >= 0 ? theme.good : theme.bad} strokeWidth={1.8} />
          </View>
          <View style={styles.investContent}>
            <Text style={[styles.investLabel, { color: theme.textSec }]}>Inversiones</Text>
            <Text style={[styles.investValue, { color: theme.text }]}>{MXN(investmentsTotal)}</Text>
          </View>
          <View style={styles.investGainBlock}>
            <Text style={[styles.investGainPct, { color: investmentsGain >= 0 ? theme.good : theme.bad }]}>
              {investmentsGain >= 0 ? '+' : ''}{investmentsGainPct.toFixed(2)}%
            </Text>
            <Text style={[styles.investGainAmt, { color: investmentsGain >= 0 ? theme.good : theme.bad }]}>
              {investmentsGain >= 0 ? '+' : ''}{MXN(investmentsGain)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.recentHeader, { paddingHorizontal: pad, marginBottom: 10 }]}>
          <Text style={[styles.recentTitle, { color: theme.text }]}>Movimientos recientes</Text>
          <TouchableOpacity onPress={() => router.push('/expenses')}>
            <Text style={[styles.seeAll, { color: accent }]}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.txList, { marginHorizontal: pad, borderRadius: 20, backgroundColor: theme.surface, borderColor: theme.border }]}>
          {recentTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textTer, padding: 20 }]}>Sin transacciones recientes</Text>
          ) : (
            recentTransactions.map((tx, i) => {
              const sub = tx.is_subscription ? subsMap[tx.title?.toLowerCase()] : null;
              return (
                <View
                  key={tx.id}
                  style={[styles.txRow, { borderBottomColor: theme.border, borderBottomWidth: i < recentTransactions.length - 1 ? 0.5 : 0 }]}
                >
                  <View style={[styles.txIconWrapper, { backgroundColor: theme.surfaceAlt }]}>
                    <CategoryIcon name={tx.category_name} size={18} color={theme.textSec} />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={[styles.txMerchant, { color: theme.text }]} numberOfLines={1}>{tx.title || tx.category_name || 'Sin título'}</Text>
                    <Text style={[styles.txWhen, { color: theme.textTer }]}>{getTimeLabel(tx.timestamp)}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: theme.text }]}>
                    {tx.type === 'expense' ? '−' : '+'}{MXN(Math.abs(tx.amount))}
                  </Text>
                  {sub && (
                    <TouchableOpacity
                      style={[styles.quickPayBtn, { backgroundColor: `${accent}18` }]}
                      onPress={() => { setQuickPaySub(sub); setShowQuickPay(true); }}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                    >
                      <DesignIcon.Bolt size={14} color={accent} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <QuickPaySheet
        visible={showQuickPay}
        subscription={quickPaySub}
        onClose={() => setShowQuickPay(false)}
        onSuccess={() => setShowQuickPay(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingLabel: { fontSize: 13, letterSpacing: -0.1 },
  monthLabel: { fontSize: 11, marginTop: 2 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  walletCard: {
    width: 148,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  walletCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  walletIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  walletTypeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  walletName: { fontSize: 12, fontWeight: '500' },
  walletBalance: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  walletSub: { fontSize: 10, marginTop: 1 },
  heroSection: {},
  heroLabel: { fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount: { flexDirection: 'row', alignItems: 'baseline' },
  heroInt: { fontSize: 56, fontWeight: '600', letterSpacing: -2.4 },
  heroDec: { fontSize: 32, letterSpacing: -1 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  deltaText: { fontSize: 13, fontWeight: '500' },
  deltaLabel: { fontSize: 13 },
  monthCard: { borderWidth: 1 },
  monthCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  monthCardTitle: { fontSize: 13 },
  monthCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  monthCardAmount: { fontSize: 28, fontWeight: '600', letterSpacing: -1 },
  progressBar: { height: 6, overflow: 'hidden' },
  progressFill: { height: '100%' },
  summaryGrid: { flexDirection: 'row' },
  summaryCard: { flex: 1, borderWidth: 1 },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  summaryHint: { fontSize: 11, marginTop: 4 },
  investmentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  investIconWrapper: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  investContent: { flex: 1 },
  investLabel: { fontSize: 13 },
  investValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  investGainBlock: { alignItems: 'flex-end' },
  investGainPct: { fontSize: 13, fontWeight: '600' },
  investGainAmt: { fontSize: 11, marginTop: 1 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  seeAll: { fontSize: 12, fontWeight: '500' },
  txList: { borderWidth: 1, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  txIconWrapper: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txContent: { flex: 1, minWidth: 0 },
  txMerchant: { fontSize: 14, fontWeight: '500' },
  txWhen: { fontSize: 11, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '500' },
  emptyText: { textAlign: 'center' },
  quickPayBtn: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
