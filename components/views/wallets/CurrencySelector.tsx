import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  {
    code: "MXN",
    symbol: "$",
    name: "Peso Mexicano",
    flag: "🇲🇽",
  },
  {
    code: "USD",
    symbol: "$",
    name: "Dólar Estadounidense",
    flag: "🇺🇸",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flag: "🇪🇺",
  },
  {
    code: "COP",
    symbol: "$",
    name: "Peso Colombiano",
    flag: "🇨🇴",
  },
  {
    code: "ARS",
    symbol: "$",
    name: "Peso Argentino",
    flag: "🇦🇷",
  },
  {
    code: "CLP",
    symbol: "$",
    name: "Peso Chileno",
    flag: "🇨🇱",
  },
  {
    code: "PEN",
    symbol: "S/",
    name: "Sol Peruano",
    flag: "🇵🇪",
  },
  {
    code: "BRL",
    symbol: "R$",
    name: "Real Brasileño",
    flag: "🇧🇷",
  },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

export default function CurrencySelector({
  selectedCurrency,
  onSelectCurrency,
}: CurrencySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Moneda</Text>
      <View style={styles.currencyGrid}>
        {CURRENCIES.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyOption,
              selectedCurrency === currency.code && styles.currencyOptionSelected,
            ]}
            onPress={() => onSelectCurrency(currency.code)}
          >
            <Text style={styles.currencyFlag}>{currency.flag}</Text>
            <View style={styles.currencyInfo}>
              <Text style={[
                styles.currencyCode,
                selectedCurrency === currency.code && styles.currencyCodeSelected
              ]}>
                {currency.code}
              </Text>
              <Text style={styles.currencyName}>{currency.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  currencyGrid: {
    gap: 12,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "transparent",
  },
  currencyOptionSelected: {
    borderColor: "#7952FC",
    backgroundColor: "#f0f0ff",
  },
  currencyFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  currencyCodeSelected: {
    color: "#7952FC",
  },
  currencyName: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
