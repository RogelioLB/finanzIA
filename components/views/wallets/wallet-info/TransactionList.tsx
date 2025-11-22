import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { currencies, Currency } from '../../../../constants/currencies';
import { Transaction } from './types';

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
}

export default function TransactionList({ transactions, currency }: TransactionListProps) {
  const getCurrencySymbol = (currency: string) => {
    const currencyObj = currencies.find((c: Currency) => c.code === currency);
    return currencyObj?.symbol || '$';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isExcluded = item.is_excluded === 1;
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionInfo}>
          <Text style={[
            styles.transactionTitle,
            isExcluded && styles.excludedText
          ]}>
            {item.title}
          </Text>
          {item.note && <Text style={[
            styles.transactionNote,
            isExcluded && styles.excludedText
          ]}>
            {item.note}
          </Text>}
          <Text style={[
            styles.transactionDate,
            isExcluded && styles.excludedText
          ]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            isExcluded 
              ? styles.excludedAmount 
              : { color: item.type === 'income' ? '#4CAF50' : '#FF6B6B' },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}
          {getCurrencySymbol(currency)}
          {item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay transacciones</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransactionItem}
      keyExtractor={(item) => item.id}
      style={styles.transactionsList}
      contentContainerStyle={styles.transactionsContent}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  transactionsList: {
    marginHorizontal: 16,
  },
  transactionsContent: {
    paddingBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  excludedText: {
    color: '#9CA3AF',
  },
  excludedAmount: {
    color: '#9CA3AF',
  },
});
