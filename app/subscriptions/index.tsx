import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { MXN } from "@/theme/format";
import { Subscription } from "@/lib/models/types";
import QuickPaySheet from "@/components/sheets/QuickPaySheet";

function SubscriptionIcon({ name, size, color }: { name?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  const n = (name || '').toLowerCase();
  if (n.includes('netflix') || n.includes('streaming') || n.includes('video')) return <DesignIcon.Fun {...props} />;
  if (n.includes('spotify') || n.includes('música') || n.includes('music')) return <DesignIcon.Fun {...props} />;
  if (n.includes('gym') || n.includes('gimnasio') || n.includes('fit')) return <DesignIcon.Health {...props} />;
  if (n.includes('luz') || n.includes('electric') || n.includes('servicio')) return <DesignIcon.Bolt {...props} />;
  if (n.includes('internet') || n.includes('wifi')) return <DesignIcon.Stocks {...props} />;
  if (n.includes('telef') || n.includes('phone')) return <DesignIcon.Phone {...props} />;
  return <DesignIcon.Bolt {...props} />;
}

function dayLabel(daysUntil: number) {
  if (daysUntil === 0) return 'Hoy';
  if (daysUntil === 1) return 'Mañana';
  return `En ${daysUntil}d`;
}

export default function SubscriptionsScreen() {
  const { theme, accent, density, fabIconColor } = useTheme();
  const router = useRouter();
  const { subscriptions } = useSubscriptions();

  const [quickPaySub, setQuickPaySub] = useState<Subscription | null>(null);
  const [showQuickPay, setShowQuickPay] = useState(false);

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const today = new Date();

  const enriched = useMemo(() => {
    return subscriptions.map(s => {
      const due = s.next_payment_date ? new Date(s.next_payment_date) : new Date(today.getFullYear(), today.getMonth(), 1);
      if (due < today) due.setMonth(due.getMonth() + 1);
      const dayOfMonth = due.getDate();
      const daysUntil = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...s, due, daysUntil, dayOfMonth };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [subscriptions, today]);

  const incomes = enriched.filter(s => s.type === 'income');
  const subs = enriched.filter(s => s.type !== 'income');
  const totalIncome = incomes.reduce((sum, s) => sum + Math.abs(s.amount), 0);
  const totalSubs = subs.reduce((sum, s) => sum + Math.abs(s.amount), 0);
  const net = totalIncome - totalSubs;
  const within7 = enriched.filter(s => s.daysUntil <= 7);

  const openQuickPay = (item: Subscription) => {
    setQuickPaySub(item);
    setShowQuickPay(true);
  };

  const renderUpcoming = ({ item }: { item: any }) => {
    const isIncome = item.type === 'income';
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: theme.divider }]}
        onPress={() => router.push(`/subscriptions/edit/${item.id}` as any)}
      >
        <View style={[styles.iconBox, { backgroundColor: `${item.wallet_color || accent}22` }]}>
          <SubscriptionIcon name={item.name} size={16} color={item.wallet_color || accent} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowMeta, { color: theme.textTer }]}>{dayLabel(item.daysUntil)} · {item.wallet_name || 'Sin cuenta'}</Text>
        </View>
        <Text style={[styles.rowAmount, { color: isIncome ? theme.good : theme.text }]}>
          {isIncome ? '+' : ''}{MXN(Math.abs(item.amount))}
        </Text>
        <TouchableOpacity
          style={[styles.quickPayBtn, { backgroundColor: `${accent}18` }]}
          onPress={() => openQuickPay(item)}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <DesignIcon.Bolt size={15} color={accent} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderRecurring = ({ item }: { item: any }) => {
    const isIncome = item.type === 'income';
    const dueLabel = item.due?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) || '';
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: theme.divider }]}
        onPress={() => router.push(`/subscriptions/edit/${item.id}` as any)}
      >
        <View style={[styles.iconBox, { backgroundColor: `${item.wallet_color || accent}22` }]}>
          <SubscriptionIcon name={item.name} size={18} color={item.wallet_color || accent} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowMeta, { color: theme.textTer }]}>
            Día {item.dayOfMonth} · próximo {dueLabel} · {item.wallet_name || ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.rowAmount, { color: isIncome ? theme.good : theme.text }]}>
            {isIncome ? '+' : ''}{MXN(Math.abs(item.amount))}
          </Text>
          <Text style={[styles.rowSubAmount, { color: theme.textTer }]}> /mes</Text>
        </View>
        <TouchableOpacity
          style={[styles.quickPayBtn, { backgroundColor: `${accent}18` }]}
          onPress={() => openQuickPay(item)}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <DesignIcon.Bolt size={15} color={accent} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: pad, paddingVertical: 12, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Recurrentes</Text>
        <TouchableOpacity
          onPress={() => router.push("/subscriptions/add" as any)}
          style={[styles.addBtn, { backgroundColor: accent }]}
        >
          <DesignIcon.Plus size={18} color={fabIconColor} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <View>
            {/* Net flow card */}
            <View style={[styles.netCard, { marginHorizontal: pad, backgroundColor: theme.surface, borderColor: theme.border, marginTop: 8, marginBottom: 14 }]}>
              <Text style={[styles.netLabel, { color: theme.textSec }]}>Flujo mensual neto</Text>
              <Text style={[styles.netValue, { color: net >= 0 ? theme.text : theme.bad }]}>
                {net >= 0 ? '+' : '−'}{MXN(Math.abs(net))}
              </Text>
              <View style={styles.netStats}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.netStatLabel, { color: theme.textTer }]}>Ingresos</Text>
                  <Text style={[styles.netStatValue, { color: theme.good }]}>+{MXN(totalIncome)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: theme.divider }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.netStatLabel, { color: theme.textTer }]}>Suscripciones</Text>
                  <Text style={[styles.netStatValue, { color: theme.bad }]}>{MXN(totalSubs)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: theme.divider }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.netStatLabel, { color: theme.textTer }]}>Activas</Text>
                  <Text style={[styles.netStatValue, { color: theme.text }]}>{subs.length}</Text>
                </View>
              </View>
            </View>

            {/* Upcoming 7 days */}
            {within7.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: pad, marginBottom: 10 }]}>Próximos 7 días</Text>
                <View style={[styles.listCard, { marginHorizontal: pad, backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {within7.map((item, i) => (
                    <React.Fragment key={item.id}>
                      {renderUpcoming({ item })}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            {/* Incomes */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: pad, marginBottom: 10 }]}>
              Ingresos · {incomes.length}
            </Text>
            <View style={[styles.listCard, { marginHorizontal: pad, marginBottom: 18, backgroundColor: theme.surface, borderColor: theme.border }]}>
              {incomes.length === 0 && (
                <View style={styles.emptySection}>
                  <Text style={[styles.emptySectionText, { color: theme.textTer }]}>Sin ingresos recurrentes</Text>
                </View>
              )}
              {incomes.map((item, i) => renderRecurring({ item }))}
            </View>

            {/* Subscriptions */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: pad, marginBottom: 10 }]}>
              Suscripciones · {subs.length}
            </Text>
            <View style={[styles.listCard, { marginHorizontal: pad, marginBottom: 24, backgroundColor: theme.surface, borderColor: theme.border }]}>
              {subs.length === 0 && (
                <View style={styles.emptySection}>
                  <Text style={[styles.emptySectionText, { color: theme.textTer }]}>Sin suscripciones</Text>
                </View>
              )}
              {subs.map((item, i) => renderRecurring({ item }))}
            </View>
          </View>
        }
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  netCard: { borderRadius: 22, padding: 18, borderWidth: 1 },
  netLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  netValue: { fontSize: 32, fontWeight: '600', letterSpacing: -1.2, marginBottom: 14 },
  netStats: { flexDirection: 'row', gap: 14 },
  netStatLabel: { fontSize: 11, marginBottom: 3 },
  netStatValue: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  listCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 0.5 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowMeta: { fontSize: 11, marginTop: 1 },
  rowAmount: { fontSize: 14, fontWeight: '600' },
  rowSubAmount: { fontSize: 10, marginTop: 2 },
  emptySection: { padding: 20, alignItems: 'center' },
  emptySectionText: { fontSize: 13 },
  quickPayBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
});