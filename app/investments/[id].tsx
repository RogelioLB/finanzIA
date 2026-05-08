import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { MXN, MXN_decimal } from '@/theme/format';
import { useSQLiteContext } from 'expo-sqlite';
import { Investment } from '@/lib/database/investmentService';
import { DesignIcon } from '@/components/ui/Icon';

const INVESTMENT_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  bond: DesignIcon.Bond,
  bank: DesignIcon.Bank,
  piggy: DesignIcon.PiggyBank,
  wallet: DesignIcon.Wallet,
  trend: DesignIcon.TrendUp,
  cash: DesignIcon.Cash,
};

function InvestmentIcon({ iconId, size, color }: { iconId: string; size: number; color: string }) {
  const IconComponent = INVESTMENT_ICON_MAP[iconId] ?? DesignIcon.TrendUp;
  return <IconComponent size={size} color={color} strokeWidth={1.7} />;
}

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, accent, density } = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [history, setHistory] = useState<{ date: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const inv = await db.getFirstAsync<Investment>('SELECT * FROM investments WHERE id = ?', [id]);
      setInvestment(inv);
      if (inv) {
        const hist = await db.getAllAsync<{ date: number; value: number }>(
          'SELECT date, value FROM investment_history WHERE investment_id = ? ORDER BY date DESC LIMIT 30',
          [id]
        );
        setHistory(hist.reverse());
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar inversión',
      '¿Estás seguro de eliminar esta inversión? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await db.runAsync('DELETE FROM investment_history WHERE investment_id = ?', [id]);
            await db.runAsync('DELETE FROM investments WHERE id = ?', [id]);
            router.back();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push('/investments/edit/' + id as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.textSec }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!investment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: theme.text }}>Inversión no encontrada</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: accent }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalGain = investment.current_value - investment.principal;
  const gainPct = (totalGain / investment.principal) * 100;
  const dailyRate = Math.pow(1 + investment.annual_rate / 100, 1 / 365) - 1;
  const dailyGain = investment.current_value * dailyRate;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const daysInvested = Math.floor((startOfToday.getTime() - investment.start_date) / (24 * 60 * 60 * 1000));

  const sparklinePoints = history.slice(-14);
  const minVal = sparklinePoints.length > 0 ? Math.min(...sparklinePoints.map(p => p.value)) : 0;
  const maxVal = sparklinePoints.length > 0 ? Math.max(...sparklinePoints.map(p => p.value)) : 1;
  const range = maxVal - minVal || 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border, paddingHorizontal: pad, paddingVertical: 12, borderBottomWidth: 0.5 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: theme.text, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{investment.name}</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Text style={{ fontSize: 22, color: theme.text }}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.heroCard, { marginHorizontal: pad, marginTop: 20, backgroundColor: investment.color + '22', borderRadius: 24, padding: compact ? 18 : 22, borderWidth: 1, borderColor: investment.color + '44' }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: investment.color }]}>
              <InvestmentIcon iconId={investment.icon} size={26} color="#fff" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: theme.text }]}>{investment.name}</Text>
              <Text style={[styles.heroRate, { color: theme.textSec }]}>{investment.annual_rate}% TAE</Text>
            </View>
          </View>

          <View style={[styles.sparkline, { height: 60, marginTop: 16, marginBottom: 4 }]}>
            {sparklinePoints.length > 1 && sparklinePoints.map((point, i) => {
              const x = (i / (sparklinePoints.length - 1)) * 100;
              const y = 100 - ((point.value - minVal) / range) * 100;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    bottom: `${y}%`,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: investment.color,
                  }}
                />
              );
            })}
          </View>

          <Text style={[styles.heroValue, { color: theme.text }]}>{MXN_decimal(investment.current_value)}</Text>
          <Text style={[styles.heroGain, { color: totalGain >= 0 ? theme.good : theme.bad }]}>
            {totalGain >= 0 ? '+' : ''}{MXN(totalGain)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%) desde inicio
          </Text>
        </View>

        <View style={[styles.statsGrid, { marginHorizontal: pad, marginTop: 16, gap: 10 }]}>
          {[
            { label: 'Ganancia diaria', value: `${totalGain >= 0 ? '+' : ''}${MXN(dailyGain)}` },
            { label: 'Días invertidos', value: `${daysInvested}` },
            { label: 'Tasa diaria', value: `${(dailyRate * 100).toFixed(4)}%` },
            { label: 'Capital inicial', value: MXN(investment.principal) },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, padding: compact ? 12 : 14, borderWidth: 1, flex: 1 }]}>
              <Text style={[styles.statLabel, { color: theme.textTer }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoSection, { marginHorizontal: pad, marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>INFORMACIÓN</Text>
          <View style={[styles.infoTable, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, marginTop: 8, borderWidth: 1, overflow: 'hidden' }]}>
            {[
              ['Fecha de inicio', new Date(investment.start_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })],
              ['Última capitalización', new Date(investment.last_compound_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })],
              ['Moneda', investment.currency],
              ['Estado', investment.is_active ? 'Activa' : 'Inactiva'],
              ['Notas', investment.notes || 'Sin notas'],
            ].map(([label, value], i) => (
              <View key={label} style={[styles.infoRow, { borderBottomWidth: i < 4 ? 0.5 : 0, borderColor: theme.border }]}>
                <Text style={[styles.infoLabel, { color: theme.textSec }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

{history.length > 0 && (
          <View style={[styles.historySection, { marginHorizontal: pad, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>HISTORIAL RECIENTE</Text>
            <View style={[styles.historyList, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, marginTop: 8, borderWidth: 1, overflow: 'hidden' }]}>
              {history.slice(-10).reverse().map((entry, i) => (
                <View key={entry.date} style={[styles.historyRow, { borderBottomWidth: i < Math.min(history.length, 10) - 1 ? 0.5 : 0, borderColor: theme.border }]}>
                  <Text style={[styles.historyDate, { color: theme.textSec }]}>
                    {new Date(entry.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{MXN_decimal(entry.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!investment.is_frozen && (
          <View style={[styles.actionRow, { marginHorizontal: pad, marginTop: 20, gap: 12 }]}>
            <TouchableOpacity
              onPress={() => router.push('/investments/transaction/' + id as any + '?mode=add')}
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, padding: 16, flex: 1, alignItems: 'center' }]}
            >
              <DesignIcon.Plus size={22} color={theme.good} strokeWidth={2} />
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14, marginTop: 6 }}>Agregar</Text>
            </TouchableOpacity>
            {investment.current_value > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/investments/transaction/' + id as any + '?mode=withdraw')}
                style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 16, padding: 16, flex: 1, alignItems: 'center' }]}
              >
                <DesignIcon.Minus size={22} color={theme.bad} strokeWidth={2} />
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14, marginTop: 6 }}>Retirar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, { marginHorizontal: pad, marginTop: 24, borderColor: theme.bad + '44', borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center' }]}
        >
          <Ionicons name="trash-outline" size={20} color={theme.bad} />
          <Text style={[styles.deleteBtnText, { color: theme.bad, marginLeft: 8 }]}>Eliminar inversion</Text>
        </TouchableOpacity>
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
  sparkline: { position: 'relative' },
  heroValue: { fontSize: 32, fontWeight: '600', letterSpacing: -1.2, marginTop: 16 },
  heroGain: { fontSize: 13, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: {},
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  infoSection: {},
  sectionTitle: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  infoTable: {},
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  historySection: {},
  historyList: {},
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  historyDate: { fontSize: 13 },
  historyValue: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500' },
  actionRow: { flexDirection: 'row' },
  actionBtn: {},
});