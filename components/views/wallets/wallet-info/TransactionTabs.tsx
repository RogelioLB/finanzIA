import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TransactionTabsProps {
  selectedTab: 'income' | 'expenses';
  onTabChange: (tab: 'income' | 'expenses') => void;
  incomeCount: number;
  expenseCount: number;
}

export default function TransactionTabs({ 
  selectedTab, 
  onTabChange, 
  incomeCount, 
  expenseCount 
}: TransactionTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'income' && styles.activeTab,
        ]}
        onPress={() => onTabChange('income')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'income' && styles.activeTabText,
          ]}
        >
          Ingresos ({incomeCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          selectedTab === 'expenses' && styles.activeTab,
        ]}
        onPress={() => onTabChange('expenses')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'expenses' && styles.activeTabText,
          ]}
        >
          Gastos ({expenseCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#7952FC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
});
