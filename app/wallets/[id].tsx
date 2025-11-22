import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WalletInfo } from "../../components/views/wallets/wallet-info";
import { useWallets } from "../../contexts/WalletsContext";
import { Wallet } from "../../lib/database/sqliteService";

export default function WalletDetailsScreen() {
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
      if (walletData) {
        setWallet(walletData);
      } else {
        setError("Wallet no encontrada");
      }
    } catch (err) {
      console.error("Error loading wallet:", err);
      setError("Error al cargar la wallet");
    } finally {
      setIsLoading(false);
    }
  }, [id, getWalletById]);

  // Cargar wallet cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet])
  );

  // También cargar cuando cambian las wallets en el contexto
  useEffect(() => {
    if (id) {
      const walletData = getWalletById(id);
      if (walletData) {
        setWallet(walletData);
      }
    }
  }, [wallets, id, getWalletById]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Wallet no encontrada"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <WalletInfo wallet={wallet} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    marginBottom: 20,
  },
});
