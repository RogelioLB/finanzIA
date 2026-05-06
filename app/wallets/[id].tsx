import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WalletInfo } from "@/components/views/wallets/wallet-info";
import { useWallets } from "@/contexts/WalletsContext";
import { Wallet } from "@/lib/database/sqliteService";
import { useTheme } from "@/theme/ThemeProvider";

export default function WalletDetailsScreen() {
  const { theme, accent } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWalletById, wallets } = useWallets();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!id) {
      setError("ID de wallet no proporcionado");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const walletData = await getWalletById(id);
      if (walletData) setWallet(walletData);
      else setError("Wallet no encontrada");
    } catch (err) {
      setError("Error al cargar la wallet");
    } finally {
      setIsLoading(false);
    }
  }, [id, getWalletById]);

  useFocusEffect(
    useCallback(() => { loadWallet(); }, [loadWallet])
  );

  useEffect(() => {
    if (id) {
      const walletData = getWalletById(id);
      if (walletData) setWallet(walletData);
    }
  }, [wallets, id, getWalletById]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[styles.loadingText, { color: theme.textSec }]}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !wallet) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.bad }]}>{error || "Wallet no encontrada"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <WalletInfo wallet={wallet} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 15 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, marginBottom: 20 },
});