import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/theme/ThemeProvider';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useSubscriptions } from '@/contexts/SubscriptionsContext';
import { MXN } from '@/theme/format';
import { DesignIcon } from '@/components/ui/Icon';
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
  if (n.includes('inversi') || n.includes('bolsa') || n.includes('acciones') || n.includes('crypto')) return <DesignIcon.Stocks {...props} />;
  if (n.includes('salario') || n.includes('sueldo') || n.includes('pago')) return <DesignIcon.Cash {...props} />;
  if (n.includes('otro') || n.includes('otros')) return <DesignIcon.Dots {...props} />;
  return <DesignIcon.Bag {...props} />;
}

const PILL_W = 82;
const PILL_H = 60;
const PILL_GAP = 8;

interface MonthTab { month: number; year: number; label: string; shortLabel: string; }
interface ExpenseTransaction {
  id: string; title: string; amount: number; type: string; timestamp: number;
  category_name?: string; wallet_name?: string;
  is_excluded: number; is_subscription: number;
}
interface DayGroup { date: Date; title: string; data: ExpenseTransaction[]; }
interface MonthData {
  groups: DayGroup[];
  expenses: number;
  categories: { name: string; total: number }[];
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_NAMES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatSectionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const f = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function buildMonthData(txs: ExpenseTransaction[], month: number, year: number): MonthData {
  const filtered = txs.filter(t =>
    t.type === 'expense' && !t.is_excluded &&
    new Date(t.timestamp).getMonth() === month &&
    new Date(t.timestamp).getFullYear() === year
  );

  // Sort descending
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  // Group by day
  const dayMap: Record<string, ExpenseTransaction[]> = {};
  for (const t of sorted) {
    const d = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayMap[key]) dayMap[key] = [];
    dayMap[key].push(t);
  }
  const groups: DayGroup[] = Object.values(dayMap).map(items => ({
    date: new Date(items[0].timestamp),
    title: formatSectionDate(items[0].timestamp),
    data: items,
  }));

  // Stats
  const expenses = filtered.reduce((s, t) => s + Math.abs(t.amount), 0);

  // Categories
  const catMap: Record<string, { name: string; total: number }> = {};
  for (const t of filtered) {
    const key = t.category_name || 'Sin categoría';
    if (!catMap[key]) catMap[key] = { name: key, total: 0 };
    catMap[key].total += Math.abs(t.amount);
  }
  const categories = Object.values(catMap).sort((a, b) => b.total - a.total);

  return { groups, expenses, categories };
}

export default function ExpensesScreen() {
  const { theme, accent, density, fabIconColor } = useTheme();
  const router = useRouter();
  const { transactions } = useTransactions();
  const { subscriptions } = useSubscriptions();

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const screenWidth = Dimensions.get('window').width;

  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(6);
  const tabRefs = useRef<(View | null)[]>([]);

  const [quickPaySub, setQuickPaySub] = useState<Subscription | null>(null);
  const [showQuickPay, setShowQuickPay] = useState(false);

  const subsMap = useMemo(() => {
    const map: Record<string, Subscription> = {};
    subscriptions.forEach(s => { map[s.name.toLowerCase()] = s; });
    return map;
  }, [subscriptions]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTabs = useMemo<MonthTab[]>(() => {
    const tabs: MonthTab[] = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      tabs.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: MONTH_NAMES[d.getMonth()],
        shortLabel: MONTH_NAMES_SHORT[d.getMonth()],
      });
    }
    return tabs;
  }, [currentMonth, currentYear]);

  // Pre-compute all 13 months at once so tab switches are instant
  const allMonthsData = useMemo<MonthData[]>(() => {
    return monthTabs.map(tab => buildMonthData(transactions as ExpenseTransaction[], tab.month, tab.year));
  }, [transactions, monthTabs]);

  const current = allMonthsData[selectedTabIndex] ?? { groups: [], expenses: 0, categories: [] };
  const prev = allMonthsData[selectedTabIndex - 1];

  const delta = prev && prev.expenses > 0
    ? ((current.expenses - prev.expenses) / prev.expenses) * 100
    : null;

  const totalForPct = current.expenses || 1;
  const isFuture = selectedTabIndex > 6;
  const selectedTab = monthTabs[selectedTabIndex];

  const handleTabPress = useCallback((index: number) => {
    setSelectedTabIndex(index);
    const el = tabRefs.current[index];
    if (el && scrollViewRef.current) {
      el.measureLayout(
        scrollViewRef.current as any,
        (x: number, _y: number, width: number) => {
          const scrollX = x - screenWidth / 2 + width / 2;
          scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: true });
        },
        () => {}
      );
    }
  }, [screenWidth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = tabRefs.current[6];
      if (el && scrollViewRef.current) {
        el.measureLayout(
          scrollViewRef.current as any,
          (x: number, _y: number, width: number) => {
            const scrollX = x - screenWidth / 2 + width / 2;
            scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: false });
          },
          () => {}
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const swipeGesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (Math.abs(e.translationX) < 50) return;
      if (e.translationX < 0 && selectedTabIndex < monthTabs.length - 1) {
        handleTabPress(selectedTabIndex + 1);
      } else if (e.translationX > 0 && selectedTabIndex > 0) {
        handleTabPress(selectedTabIndex - 1);
      }
    }),
  [selectedTabIndex, monthTabs.length, handleTabPress]);

  const renderSectionHeader = useCallback(({ section }: { section: DayGroup }) => {
    const dayNumber = section.date.getDate();
    const isToday = section.date.toDateString() === now.toDateString();
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.dateCircle, { backgroundColor: isToday ? accent : theme.surfaceAlt }]}>
          <Text style={[styles.dayNumber, { color: isToday ? fabIconColor : theme.textSec }]}>{dayNumber}</Text>
        </View>
        <View style={styles.dateTextBox}>
          <Text style={[styles.sectionHeaderText, { color: theme.textSec }]}>{section.title}</Text>
          {isToday && (
            <View style={[styles.todayBadge, { backgroundColor: accent }]}>
              <Text style={styles.todayBadgeText}>HOY</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [accent, theme, fabIconColor]);

  const renderTransactionItem = useCallback(({ item }: { item: ExpenseTransaction }) => {
    const sub = item.is_subscription ? subsMap[item.title?.toLowerCase()] : null;
    return (
      <TouchableOpacity
        style={[styles.txRow, { borderBottomColor: theme.divider }]}
        onPress={() => router.push(`/edit-transaction/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.txIcon, { backgroundColor: theme.surface }]}>
          <CategoryIcon name={item.category_name} size={18} color={theme.textSec} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title || item.category_name || 'Sin título'}
          </Text>
          {item.wallet_name && (
            <Text style={[styles.txMeta, { color: theme.textTer }]} numberOfLines={1}>{item.wallet_name}</Text>
          )}
        </View>
        <Text style={[styles.txAmount, { color: theme.bad }]}>−{MXN(Math.abs(item.amount))}</Text>
        {sub && (
          <TouchableOpacity
            style={[styles.quickPayBtn, { backgroundColor: `${accent}18` }]}
            onPress={() => { setQuickPaySub(sub); setShowQuickPay(true); }}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <DesignIcon.Bolt size={14} color={accent} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [subsMap, accent, theme, router]);

  // ListHeader: NO marginHorizontal — el SectionList ya tiene paddingHorizontal: pad
  const ListHeader = useMemo(() => (
    <View style={{ paddingTop: 4 }}>
      {/* Stats card */}
      <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 16, opacity: isFuture ? 0.55 : 1 }]}>
        <Text style={[styles.statsCardLabel, { color: theme.textSec }]}>
          {selectedTab?.label} {selectedTab?.year} · Total
        </Text>
        <Text style={[styles.statsCardValue, { color: theme.text }]}>{MXN(current.expenses)}</Text>
        {delta !== null && (
          <View style={styles.statsCardDelta}>
            {delta >= 0
              ? <DesignIcon.TrendUp size={12} color={theme.bad} strokeWidth={2} />
              : <DesignIcon.TrendDown size={12} color={theme.good} strokeWidth={2} />
            }
            <Text style={[styles.statsCardDeltaText, { color: delta >= 0 ? theme.bad : theme.good }]}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs {monthTabs[selectedTabIndex - 1]?.shortLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Categories breakdown */}
      {current.categories.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSec, marginBottom: 10 }]}>Por categoría</Text>
          <View style={[styles.catCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {current.categories.map((cat, i) => {
              const pct = cat.total / totalForPct;
              return (
                <View key={cat.name} style={[styles.catRow, { borderBottomColor: theme.divider, borderBottomWidth: i < current.categories.length - 1 ? 0.5 : 0 }]}>
                  <View style={[styles.catIconBox, { backgroundColor: theme.surfaceAlt }]}>
                    <CategoryIcon name={cat.name} size={16} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catTopRow}>
                      <Text style={[styles.catName, { color: theme.text }]} numberOfLines={1}>{cat.name}</Text>
                      <Text style={[styles.catAmount, { color: theme.text }]}>{MXN(cat.total)}</Text>
                      <Text style={[styles.catPct, { color: theme.textTer }]}>{(pct * 100).toFixed(0)}%</Text>
                    </View>
                    <View style={[styles.catBar, { backgroundColor: theme.surfaceAlt }]}>
                      <View style={[styles.catBarFill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.textSec, marginBottom: 4 }]}>Movimientos</Text>
    </View>
  ), [current, delta, isFuture, selectedTab, monthTabs, selectedTabIndex, totalForPct, theme, accent]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <Text style={[styles.title, { color: theme.text }]}>Gastos</Text>
        <Text style={[styles.subtitle, { color: theme.textSec }]}>Desliza para navegar entre meses</Text>
      </View>

      {/* Month pills carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: screenWidth / 2 - PILL_W / 2,
          paddingRight: screenWidth / 2 - PILL_W / 2,
          paddingVertical: 12,
          gap: PILL_GAP,
        }}
        style={{ flexGrow: 0 }}
      >
        {monthTabs.map((tab, index) => {
          const active = selectedTabIndex === index;
          const isCurrentMonth = tab.month === currentMonth && tab.year === currentYear;
          const future = index > 6;
          return (
            <TouchableOpacity
              key={`${tab.year}-${tab.month}`}
              ref={el => { tabRefs.current[index] = el; }}
              style={[
                styles.pill,
                {
                  width: PILL_W,
                  height: PILL_H,
                  backgroundColor: active ? accent : theme.surface,
                  borderColor: active ? accent : theme.border,
                  opacity: future ? 0.55 : 1,
                },
              ]}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.8}
            >
              {isCurrentMonth && (
                <View style={[styles.pillDot, { backgroundColor: active ? fabIconColor : accent }]} />
              )}
              <Text style={[styles.pillMonth, { color: active ? fabIconColor : theme.text }]}>
                {tab.shortLabel}
              </Text>
              <Text style={[styles.pillYear, { color: active ? `${fabIconColor}99` : theme.textTer }]}>
                {String(tab.year).slice(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <GestureDetector gesture={swipeGesture}>
        <SectionList
          sections={current.groups}
          renderItem={renderTransactionItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={t => t.id}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 120, flexGrow: 1 }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyMonth}>
              <Text style={[styles.emptyMonthText, { color: theme.textTer }]}>
                No hay gastos en {selectedTab?.label}
              </Text>
            </View>
          }
        />
      </GestureDetector>

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
  header: { paddingTop: 8, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -1.2, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  pill: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 2, paddingVertical: 8 },
  pillDot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', top: 8, right: 8 },
  pillMonth: { fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },
  pillYear: { fontSize: 11 },
  statsCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  statsCardLabel: { fontSize: 11, letterSpacing: 0.3, marginBottom: 4 },
  statsCardValue: { fontSize: 36, fontWeight: '600', letterSpacing: -1.5 },
  statsCardDelta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statsCardDeltaText: { fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  catCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  catIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  catTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catName: { flex: 1, fontSize: 13, fontWeight: '500' },
  catAmount: { fontSize: 13, fontWeight: '600', marginRight: 8, letterSpacing: -0.3 },
  catPct: { fontSize: 11, width: 30, textAlign: 'right' },
  catBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: 3, borderRadius: 2 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 4,
    marginTop: 10, marginBottom: 4,
  },
  dateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dayNumber: { fontSize: 15, fontWeight: '600' },
  dateTextBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sectionHeaderText: { fontSize: 12, fontWeight: '500', flex: 1 },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  todayBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '500' },
  txMeta: { fontSize: 11, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '600' },
  quickPayBtn: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  emptyMonth: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyMonthText: { fontSize: 14 },
});
