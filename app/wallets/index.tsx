import { useWallets } from "@/contexts/WalletsContext";
import { Wallet } from "@/lib/database/sqliteService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { MXN } from "@/theme/format";

function WalletIcon({ type, size, color }: { type?: string; size: number; color: string }) {
  const props = { size, color, strokeWidth: 1.6 };
  return type === 'credit' ? <DesignIcon.Card {...props} /> : <DesignIcon.Wallet {...props} />;
}

export default function WalletsScreen() {
  const { theme, accent, density } = useTheme();
  const [defaultWalletId, setDefaultWalletId] = useState<string | null>(null);
  const router = useRouter();
  const { wallets, isLoading, deleteWallet } = useWallets();
  const compact = density === 'compact';
  const pad = compact ? 16 : 20;

  const regularWallets = wallets.filter(w => w.type !== 'credit');

  useEffect(() => {
    if (regularWallets.length > 0 && !defaultWalletId) {
      setDefaultWalletId(regularWallets[0].id);
    }
  }, [regularWallets, defaultWalletId]);

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      "Eliminar cuenta",
      `¿Estás seguro de que quieres eliminar la cuenta "${wallet.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(wallet.id);
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la cuenta");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = (walletId: string) => {
    setDefaultWalletId(walletId);
  };

  const handleWalletPress = (walletId: string) => {
    router.push(`/wallets/${walletId}`);
  };

  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isDefault = item.id === defaultWalletId;
    const bal = item.net_balance ?? item.balance;

    return (
      <TouchableOpacity
        style={[styles.walletCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => handleWalletPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <View style={[styles.walletIcon, { backgroundColor: item.color || accent }]}>
              <WalletIcon type={item.type} size={22} color="#fff" />
            </View>
            <View style={styles.walletDetails}>
              <Text style={[styles.walletName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.walletBalance, { color: theme.textSec }]}>
                {MXN(bal)}
              </Text>
            </View>
          </View>

          <View style={styles.walletActions}>
            {isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: `${accent}22` }]}>
                <Text style={[styles.defaultBadgeText, { color: accent }]}>Principal</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSetDefault(item.id);
              }}
            >
              <Ionicons
                name={isDefault ? "star" : "star-outline"}
                size={20}
                color={isDefault ? accent : theme.textTer}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteWallet(item);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.bad} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: pad, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mis Cuentas</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: accent, borderRadius: 10 }]}
          onPress={() => router.push("/wallets/add-wallet")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSec }]}>Cargando cuentas...</Text>
          </View>
        ) : regularWallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DesignIcon.Wallet size={64} color={theme.textTer} strokeWidth={1.4} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tienes cuentas</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSec }]}>
              Añade tu primera cuenta para empezar
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: accent }]}
              onPress={() => router.push("/wallets/add-wallet")}
            >
              <Text style={styles.addFirstButtonText}>Añadir cuenta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={regularWallets}
            renderItem={renderWalletItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContainer, { paddingHorizontal: pad, paddingVertical: 16, gap: 10 }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  addButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "600", marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 },
  addFirstButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addFirstButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  listContainer: {},
  walletCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletInfo: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  walletIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  walletDetails: { flex: 1 },
  walletName: { fontSize: 15, fontWeight: "600" },
  walletBalance: { fontSize: 13, marginTop: 2 },
  walletActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  defaultBadgeText: { fontSize: 10, fontWeight: "600" },
  actionButton: { padding: 8 },
});