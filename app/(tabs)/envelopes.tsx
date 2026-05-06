import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';
import { MXN } from '@/theme/format';
import { useSQLiteService } from '@/lib/database/sqliteService';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';

interface EnvelopeData {
  id: string;
  category_name: string;
  category_icon: string;
  budget_amount: number;
  spent_amount: number;
}

const ICON_MAP: Record<string, string> = {
  'Comida': 'Food',
  'Transporte': 'Transport',
  'Entretenimiento': 'Fun',
  'Hogar': 'Home2',
  'Salud': 'Health',
  'Compras': 'Bag',
  'Servicios': 'Bolt',
  'Educación': 'Education',
};

export default function EnvelopesScreen() {
  const { theme, accent, density } = useTheme();
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;
  const [envelopes, setEnvelopes] = useState<EnvelopeData[]>([]);

  useEffect(() => {
    const loadEnvelopes = async () => {
      const db = useSQLiteContext();
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const results = await db.getAllAsync<any>(`
        SELECT 
          cbl.id,
          c.name as category_name,
          c.icon as category_icon,
          cbl.amount as budget_amount,
          COALESCE((
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.category_id = c.id
            AND t.type = 'expense'
            AND strftime('%m', datetime(t.timestamp/1000, 'unixepoch')) = ?
            AND strftime('%Y', datetime(t.timestamp/1000, 'unixepoch')) = ?
          ), 0) as spent_amount
        FROM category_budget_limits cbl
        JOIN categories c ON cbl.category_id = c.id
        WHERE NOT c.is_income
        ORDER BY c.name
      `, [month.toString().padStart(2, '0'), year.toString()]);

      setEnvelopes(results);
    };
    loadEnvelopes();
  }, []);

  const totalBudget = envelopes.reduce((s, e) => s + e.budget_amount, 0);
  const totalSpent = envelopes.reduce((s, e) => s + e.spent_amount, 0);
  const monthName = new Date().toLocaleDateString('es-MX', { month: 'long' });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.header, { paddingHorizontal: pad, marginBottom: 24 }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sobres</Text>
          <Text style={[styles.subtitle, { color: theme.textSec }]}>
            {MXN(totalSpent)} de {MXN(totalBudget)} · {envelopes.length} sobres
          </Text>
        </View>

        <View style={[styles.availCard, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: pad, marginBottom: 16, padding: compact ? 14 : 18, borderRadius: 20 }]}>
          <View style={styles.availHeader}>
            <Text style={[styles.availLabel, { color: theme.textSec }]}>Disponible</Text>
            <Text style={[styles.availMonth, { color: theme.textTer }]}>{monthNameCapitalized}</Text>
          </View>
          <Text style={[styles.availAmount, { color: theme.text }]}>{MXN(totalBudget - totalSpent)}</Text>
          <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt, borderRadius: 3, marginTop: 10 }]}>
            <View style={[styles.progressFill, { width: `${Math.min(100, totalSpent / totalBudget * 100)}%`, backgroundColor: accent, borderRadius: 3 }]} />
          </View>
        </View>

        <View style={[styles.grid, { paddingHorizontal: pad, gap: 10 }]}>
          {envelopes.map((env) => {
            const pct = env.spent_amount / env.budget_amount;
            const over = env.spent_amount > env.budget_amount;
            const near = pct >= 0.8 && !over;
            const remaining = env.budget_amount - env.spent_amount;
            const fillColor = over ? theme.bad : near ? '#F59E0B' : accent;
            const IconComp = DesignIcon[ICON_MAP[env.category_name] as keyof typeof DesignIcon] || DesignIcon.Bag;

            return (
              <View key={env.id} style={[styles.envCard, { backgroundColor: theme.surface, borderColor: over ? theme.bad : theme.border, padding: 14, borderRadius: 18, borderWidth: 1 }]}>
                <View style={styles.envHeader}>
                  <View style={[styles.envIcon, { backgroundColor: `${fillColor}22` }]}>
                    <IconComp size={16} color={fillColor} strokeWidth={1.7} />
                  </View>
                  {over && <Text style={[styles.badge, { color: theme.bad }]}>Excedido</Text>}
                  {near && !over && <Text style={[styles.badge, { color: '#F59E0B' }]}>Casi</Text>}
                </View>
                <View style={styles.envInfo}>
                  <Text style={[styles.envName, { color: theme.text }]}>{env.category_name}</Text>
                  <Text style={[styles.envRemaining, { color: theme.text }]}>{over ? `−${MXN(Math.abs(remaining))}` : MXN(remaining)}</Text>
                  <Text style={[styles.envBudget, { color: theme.textTer }]}>de {MXN(env.budget_amount)}</Text>
                </View>
                <View style={[styles.envProgress, { marginTop: 'auto' }]}>
                  <View style={[styles.miniProgress, { backgroundColor: theme.surfaceAlt, borderRadius: 2 }]}>
                    <View style={[styles.miniProgressFill, { width: `${Math.min(100, pct * 100)}%`, backgroundColor: fillColor, borderRadius: 2 }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.addBtn, { marginHorizontal: pad, marginTop: 12, borderColor: theme.borderStrong, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed' }]}>
          <Text style={[styles.addBtnText, { color: theme.textSec }]}>+ Nuevo sobre</Text>
        </TouchableOpacity>

        {envelopes.length === 0 && (
          <View style={[styles.empty, { padding: 40, alignItems: 'center' }]}>
            <DesignIcon.Envelope size={48} color={theme.textTer} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text, marginTop: 16 }]}>Sin sobres</Text>
            <Text style={[styles.emptySub, { color: theme.textTer, marginTop: 8 }]}>Crea presupuestos por categoría</Text>
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
  availCard: { borderWidth: 1 },
  availHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  availLabel: { fontSize: 12 },
  availMonth: { fontSize: 11 },
  availAmount: { fontSize: 28, fontWeight: '600', letterSpacing: -1 },
  progressBar: { height: 6, overflow: 'hidden' },
  progressFill: { height: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  envCard: { width: '48%', minHeight: 130 },
  envHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  envIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  envInfo: {},
  envName: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  envRemaining: { fontSize: 16, fontWeight: '600', letterSpacing: -0.4 },
  envBudget: { fontSize: 10, marginTop: 1 },
  envProgress: {},
  miniProgress: { height: 4, overflow: 'hidden' },
  miniProgressFill: { height: '100%' },
  addBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 13, fontWeight: '500' },
  empty: {},
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySub: { fontSize: 14 },
});