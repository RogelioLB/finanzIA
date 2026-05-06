import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN, MXN_decimal } from '@/theme/format';
import { useInvestments, InvestmentRange, PortfolioPoint } from '@/contexts/InvestmentsContext';

const RANGES: InvestmentRange[] = ['1S', '1M', '3M', '6M', '1A', 'Todo'];
const PALETTE = ['#A78BFA', '#5AC8FA', '#F59E0B', '#34C759', '#FF6B6B', '#7952FC'];

function HoldingIcon({ color, size }: { color: string; size: number }) {
  return <DesignIcon.Stocks size={size} color={color} strokeWidth={1.6} />;
}

function buildSvgPath(points: PortfolioPoint[], W: number, H: number): { line: string; area: string } {
  if (points.length < 2) return { line: '', area: '' };
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const PAD = 8;

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - PAD - ((p.value - min) / range) * (H - PAD * 2),
  }));

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${W.toFixed(1)} ${H} L 0 ${H} Z`;
  return { line, area };
}

export default function InvestmentsScreen() {
  const { theme, accent, density, fabIconColor } = useTheme();
  const router = useRouter();
  const { investments, isLoading, totalValue, totalCost, totalGain, gainPct, getHistoryForRange } = useInvestments();
  const [range, setRange] = useState<InvestmentRange>('1M');
  const [history, setHistory] = useState<PortfolioPoint[]>([]);

  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const W = Dimensions.get('window').width - pad * 2;
  const H = 140;

  useEffect(() => {
    getHistoryForRange(range).then(setHistory);
  }, [range, getHistoryForRange]);

  const positive = totalGain >= 0;
  const strokeColor = positive ? theme.good : theme.bad;

  const { line, area } = useMemo(() => buildSvgPath(history, W, H), [history, W, H]);

  const sortedByValue = useMemo(
    () => [...investments].sort((a, b) => b.current_value - a.current_value),
    [investments]
  );

  const change1dMap = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach(inv => {
      const gain = inv.current_value - inv.principal;
      map[inv.id] = inv.principal > 0 ? (gain / inv.principal) * 100 : 0;
    });
    return map;
  }, [investments]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: pad, paddingVertical: 12, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Inversiones</Text>
        <TouchableOpacity
          onPress={() => router.push('/investments/add')}
          style={[styles.addBtn, { backgroundColor: accent }]}
        >
          <DesignIcon.Plus size={18} color={fabIconColor} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingHorizontal: pad, marginTop: 16, marginBottom: 16 }]}>
          <Text style={[styles.heroLabel, { color: theme.textSec }]}>Valor del portafolio</Text>
          <Text style={[styles.heroValue, { color: theme.text }]}>{MXN_decimal(totalValue)}</Text>
          <View style={styles.heroGain}>
            {positive
              ? <DesignIcon.TrendUp size={13} color={theme.good} strokeWidth={2} />
              : <DesignIcon.TrendDown size={13} color={theme.bad} strokeWidth={2} />
            }
            <Text style={[styles.heroGainText, { color: positive ? theme.good : theme.bad }]}>
              {positive ? '+' : '−'}{MXN(Math.abs(totalGain))} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%)
            </Text>
            <Text style={[styles.heroGainLabel, { color: theme.textTer }]}>total</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={[{ paddingHorizontal: pad, marginBottom: 8 }]}>
          <Svg width={W} height={H}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={strokeColor} stopOpacity={0.22} />
                <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {/* Grid */}
            {[0.25, 0.5, 0.75].map(g => (
              <Path
                key={g}
                d={`M 0 ${(g * H).toFixed(1)} L ${W} ${(g * H).toFixed(1)}`}
                stroke={theme.divider}
                strokeWidth={1}
              />
            ))}
            {area ? (
              <Path d={area} fill="url(#grad)" />
            ) : null}
            {line ? (
              <Path d={line} stroke={strokeColor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}
          </Svg>
        </View>

        {/* Range selector */}
        <View style={[styles.rangeRow, { paddingHorizontal: pad, marginBottom: 20 }]}>
          {RANGES.map(r => {
            const active = range === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeBtn, { backgroundColor: active ? theme.surfaceAlt : 'transparent', borderRadius: 10 }]}
              >
                <Text style={[styles.rangeText, { color: active ? accent : theme.textSec }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Allocation */}
        {sortedByValue.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: pad, marginBottom: 20 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Asignación</Text>
            <View style={[styles.allocationBar, { backgroundColor: theme.surfaceAlt, marginTop: 10 }]}>
              {sortedByValue.map((inv, i) => (
                <View
                  key={inv.id}
                  style={{
                    width: `${(inv.current_value / (totalValue || 1)) * 100}%`,
                    backgroundColor: PALETTE[i % PALETTE.length],
                    height: 10,
                    borderRadius: 5,
                  }}
                />
              ))}
            </View>
            <View style={[styles.allocationLegend, { marginTop: 10 }]}>
              {sortedByValue.map((inv, i) => (
                <View key={inv.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                  <Text style={[styles.legendText, { color: theme.textSec }]}>{inv.name}</Text>
                  <Text style={[styles.legendPct, { color: theme.textTer }]}>
                    {((inv.current_value / (totalValue || 1)) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Holdings */}
        <View style={[styles.section, { paddingHorizontal: pad }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>Posiciones · {investments.length}</Text>
          <View style={[styles.holdingsList, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 10 }]}>
            {investments.length === 0 && !isLoading && (
              <View style={styles.emptyHoldings}>
                <DesignIcon.Stocks size={36} color={theme.textTer} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: theme.textTer, marginTop: 12 }]}>Sin inversiones</Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: accent, marginTop: 16 }]}
                  onPress={() => router.push('/investments/add')}
                >
                  <DesignIcon.Plus size={16} color={fabIconColor} strokeWidth={2} />
                  <Text style={[styles.emptyBtnText, { color: fabIconColor }]}>Agregar inversión</Text>
                </TouchableOpacity>
              </View>
            )}
            {investments.map((inv, i) => {
              const gain = inv.current_value - inv.principal;
              const gainPctInv = inv.principal > 0 ? (gain / inv.principal) * 100 : 0;
              const isUp = gain >= 0;
              const color = PALETTE[i % PALETTE.length];
              return (
                <TouchableOpacity
                  key={inv.id}
                  style={[styles.holdingRow, { borderBottomColor: theme.divider, borderBottomWidth: i < investments.length - 1 ? 0.5 : 0 }]}
                  onPress={() => router.push(`/investments/${inv.id}`)}
                >
                  <View style={[styles.holdingIcon, { backgroundColor: `${color}22` }]}>
                    <HoldingIcon color={color} size={18} />
                  </View>
                  <View style={styles.holdingInfo}>
                    <Text style={[styles.holdingName, { color: theme.text }]} numberOfLines={1}>{inv.name}</Text>
                    <Text style={[styles.holdingMeta, { color: theme.textTer }]}>
                      {inv.annual_rate.toFixed(1)}% anual ·{' '}
                      <Text style={{ color: isUp ? theme.good : theme.bad }}>
                        {isUp ? '+' : ''}{gainPctInv.toFixed(2)}%
                      </Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.holdingValue, { color: theme.text }]}>{MXN_decimal(inv.current_value)}</Text>
                    <Text style={[styles.holdingGain, { color: isUp ? theme.good : theme.bad }]}>
                      {isUp ? '+' : '−'}{MXN(Math.abs(gain))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {investments.length > 0 && (
            <TouchableOpacity
              style={[styles.addHoldingBtn, { borderColor: theme.borderStrong, marginTop: 12 }]}
              onPress={() => router.push('/investments/add')}
            >
              <DesignIcon.Plus size={18} color={theme.text} strokeWidth={2} />
              <Text style={[styles.addHoldingBtnText, { color: theme.text }]}>Agregar inversión</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  hero: {},
  heroLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  heroValue: { fontSize: 44, fontWeight: '600', letterSpacing: -1.8, lineHeight: 52 },
  heroGain: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  heroGainText: { fontSize: 14, fontWeight: '500' },
  heroGainLabel: { fontSize: 13 },
  rangeRow: { flexDirection: 'row', gap: 4 },
  rangeBtn: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center' },
  rangeText: { fontSize: 12, fontWeight: '600' },
  section: {},
  sectionTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  allocationBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  allocationLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 11 },
  legendPct: { fontSize: 11 },
  holdingsList: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  emptyHoldings: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '600' },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  holdingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  holdingInfo: { flex: 1 },
  holdingName: { fontSize: 14, fontWeight: '500', letterSpacing: -0.2 },
  holdingMeta: { fontSize: 11, marginTop: 2 },
  holdingValue: { fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },
  holdingGain: { fontSize: 11, marginTop: 2 },
  addHoldingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed' },
  addHoldingBtnText: { fontSize: 14, fontWeight: '500' },
});
