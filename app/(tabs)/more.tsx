import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';

const TOOLS = [
  { id: 'wallets', label: 'Billeteras', icon: 'Wallet', color: '#0EA5E9', bg: '#E0F2FE', href: '/wallets' },
  { id: 'credit-cards', label: 'Tarjetas', icon: 'Card', color: '#F59E0B', bg: '#FEF3C7', href: '/credit-cards' },
  { id: 'categories', label: 'Categorías', icon: 'List', color: '#10B981', bg: '#D1FAE5', href: '/categories' },
  { id: 'subscriptions', label: 'Suscripciones', icon: 'TrendUp', color: '#8B5CF6', bg: '#EDE9FE', href: '/subscriptions' },
  { id: 'objectives', label: 'Objetivos', icon: 'PiggyBank', color: '#EF4444', bg: '#FEE2E2', href: '/objectives' },
  { id: 'investments', label: 'Inversiones', icon: 'Stocks', color: '#06B6D4', bg: '#CFFAFE', href: '/investments' },
];

const SYSTEM = [
  { id: 'ai-plan', label: 'AI Plan', icon: 'TrendUp', color: '#8B5CF6', bg: '#EDE9FE', href: '/ai-plan' },
  { id: 'debts', label: 'Deudas', icon: 'Debt', color: '#EF4444', bg: '#FEE2E2', href: '/debts' },
  { id: 'settings', label: 'Ajustes', icon: 'Settings', color: '#4F46E5', bg: '#E0E7FF', href: '/settings' },
  { id: 'about', label: 'Acerca de', icon: 'Bank', color: '#6B7280', bg: '#F3F4F6', href: '/settings/about' },
];

interface CardProps {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  href: string;
}

function ToolCard({ id, label, icon, color, bg, href }: CardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const IconComp = DesignIcon[icon as keyof typeof DesignIcon];
  return (
    <TouchableOpacity
      key={id}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => router.push(href as any)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <IconComp size={22} color={color} strokeWidth={1.7} />
      </View>
      <Text style={[styles.cardLabel, { color: theme.text }]}>{label}</Text>
      <DesignIcon.Chevron size={14} color={theme.textTer} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { theme, accent } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Más</Text>
        </View>

        <View style={[styles.section, { paddingHorizontal: 18 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>HERRAMIENTAS</Text>
          <View style={styles.sectionGap}>
            {TOOLS.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: 18, marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSec }]}>SISTEMA</Text>
          <View style={styles.sectionGap}>
            {SYSTEM.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </View>
        </View>

        <View style={[styles.footer, { paddingHorizontal: 18, marginTop: 32 }]}>
          <View style={[styles.footerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.version, { color: theme.text }]}>FinanzIA v1.0.2</Text>
            <Text style={[styles.tech, { color: theme.textTer }]}>React Native + Expo SDK 53</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 8,
  },
  pageTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -1.5 },
  section: {},
  sectionTitle: { fontSize: 11, letterSpacing: 0.7, fontWeight: '600', marginBottom: 10, paddingLeft: 2 },
  sectionGap: { gap: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  footer: { paddingBottom: 16 },
  footerCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
  },
  version: { fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  tech: { fontSize: 12, marginTop: 4 },
});