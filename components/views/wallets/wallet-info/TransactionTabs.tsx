import { useTheme } from "@/theme/ThemeProvider";
import { getFabContrast } from "@/theme/tokens";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TransactionTabsProps {
  selectedTab: "income" | "expenses";
  onTabChange: (tab: "income" | "expenses") => void;
  incomeCount: number;
  expenseCount: number;
}

export default function TransactionTabs({ selectedTab, onTabChange, incomeCount, expenseCount }: TransactionTabsProps) {
  const { theme, accent } = useTheme();
  const activeTextColor = getFabContrast(accent);

  const tabs = [
    { id: "income" as const, label: "Ingresos", count: incomeCount },
    { id: "expenses" as const, label: "Gastos", count: expenseCount },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceAlt }]}>
      {tabs.map((tab) => {
        const active = selectedTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && { backgroundColor: accent }]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: active ? activeTextColor : theme.textSec }]}>
              {tab.label}
            </Text>
            <View style={[
              styles.badge,
              { backgroundColor: active ? `${activeTextColor}25` : theme.border },
            ]}>
              <Text style={[styles.badgeText, { color: active ? activeTextColor : theme.textTer }]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabText: { fontSize: 14, fontWeight: "600", letterSpacing: -0.2 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
});
