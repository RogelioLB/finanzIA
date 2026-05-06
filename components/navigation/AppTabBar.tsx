import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { DesignIcon } from '@/components/ui/Icon';

const TABS = [
  { id: 'home',     label: 'Inicio',  icon: 'Home' as const,  href: '/' },
  { id: 'expenses', label: 'Gastos',  icon: 'List' as const,  href: '/expenses' },
  { id: 'debts',    label: 'Deudas',  icon: 'Debt' as const,  href: '/debts' },
  { id: 'more',     label: 'Más',     icon: 'Dots' as const,  href: '/more' },
];

interface AppTabBarProps {
  onFabPress?: () => void;
  onNavigate?: (href: string) => void;
}

export default function AppTabBar({ onFabPress, onNavigate }: AppTabBarProps) {
  const { theme, accent, fabStyle, fabIconColor } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href as any);
    }
  };

  const fabBg = accent;

  if (fabStyle === 'floating') {
    return (
      <View style={[styles.container, { backgroundColor: theme.navBg, borderTopColor: theme.border }]}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const IconComp = DesignIcon[tab.icon];
            return (
              <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => navigate(tab.href)}>
                <IconComp size={22} color={active ? accent : theme.textTer} strokeWidth={active ? 1.9 : 1.5} />
                <Text style={[styles.tabLabel, { color: active ? accent : theme.textTer }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[styles.fabFloating, { backgroundColor: fabBg }]} onPress={onFabPress}>
          <DesignIcon.Plus size={26} color={fabIconColor} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    );
  }

  // Notch layout: Inicio · Gastos · [FAB] · Deudas · Más
  return (
    <View style={[styles.container, { backgroundColor: theme.navBg, borderTopColor: theme.border }]}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/')}>
          <DesignIcon.Home size={22} color={isActive('/') ? accent : theme.textTer} strokeWidth={isActive('/') ? 1.9 : 1.5} />
          <Text style={[styles.tabLabel, { color: isActive('/') ? accent : theme.textTer }]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/expenses')}>
          <DesignIcon.List size={22} color={isActive('/expenses') ? accent : theme.textTer} strokeWidth={isActive('/expenses') ? 1.9 : 1.5} />
          <Text style={[styles.tabLabel, { color: isActive('/expenses') ? accent : theme.textTer }]}>Gastos</Text>
        </TouchableOpacity>

        {/* FAB notch spacer */}
        <View style={styles.fabSpacer} />

        <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/debts')}>
          <DesignIcon.Debt size={22} color={isActive('/debts') ? accent : theme.textTer} strokeWidth={isActive('/debts') ? 1.9 : 1.5} />
          <Text style={[styles.tabLabel, { color: isActive('/debts') ? accent : theme.textTer }]}>Deudas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/more')}>
          <DesignIcon.Dots size={22} color={isActive('/more') ? accent : theme.textTer} strokeWidth={isActive('/more') ? 1.9 : 1.5} />
          <Text style={[styles.tabLabel, { color: isActive('/more') ? accent : theme.textTer }]}>Más</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fabNotch, { backgroundColor: fabBg, borderColor: theme.bg }]}
        onPress={onFabPress}
      >
        <DesignIcon.Plus size={28} color={fabIconColor} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  tabRow: {
    flexDirection: 'row',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 56,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  fabSpacer: {
    width: 72,
    flexShrink: 0,
  },
  fabFloating: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  fabNotch: {
    position: 'absolute',
    top: -22,
    left: Dimensions.get('window').width / 2 - 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
});
