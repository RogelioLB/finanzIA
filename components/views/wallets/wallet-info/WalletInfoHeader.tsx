import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Wallet } from '../../../../lib/database/sqliteService';
import { currencies, Currency } from '../../../../constants/currencies';

interface WalletInfoHeaderProps {
  wallet: Wallet;
}

export default function WalletInfoHeader({ wallet }: WalletInfoHeaderProps) {
  const router = useRouter();

  const getCurrencySymbol = (currency: string) => {
    const currencyObj = currencies.find((c: Currency) => c.code === currency);
    return currencyObj?.symbol || '$';
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalles de Cuenta</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            // Por ahora, mostrar un alert hasta que se implemente la pantalla de edición
            alert('Función de edición próximamente');
          }}
        >
          <Ionicons name="create-outline" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      {/* Wallet Info Card */}
      <View style={[styles.walletCard, { backgroundColor: wallet.color }]}>
        <Text style={styles.walletIcon}>{wallet.icon}</Text>
        <Text style={styles.walletName}>{wallet.name}</Text>
        <Text style={styles.walletBalance}>
          {getCurrencySymbol(wallet.currency)}{wallet.net_balance?.toFixed(2) || wallet.balance.toFixed(2)}
        </Text>
        <Text style={styles.walletCurrency}>{wallet.currency}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    padding: 8,
  },
  walletCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  walletName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  walletCurrency: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
});
