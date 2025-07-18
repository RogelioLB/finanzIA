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

export default function WalletsScreen() {
  const [defaultWalletId, setDefaultWalletId] = useState<string | null>(null);
  
  const router = useRouter();
  const { wallets, isLoading, deleteWallet } = useWallets();

  // Establecer wallet por defecto cuando se cargan las wallets
  useEffect(() => {
    if (wallets.length > 0 && !defaultWalletId) {
      setDefaultWalletId(wallets[0].id);
    }
  }, [wallets, defaultWalletId]);

  // Manejar eliminación de wallet
  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      "Eliminar cuenta",
      `¿Estás seguro de que quieres eliminar la cuenta "${wallet.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(wallet.id);
              // El contexto se actualiza automáticamente
            } catch (error) {
              console.error('Error al eliminar wallet:', error);
              Alert.alert("Error", "No se pudo eliminar la cuenta");
            }
          },
        },
      ]
    );
  };

  // Marcar como default
  const handleSetDefault = (walletId: string) => {
    setDefaultWalletId(walletId);
    // Aquí puedes implementar la lógica para guardar la preferencia en AsyncStorage o base de datos
  };

  // Navegar a detalles de wallet
  const handleWalletPress = (walletId: string) => {
    router.push(`/wallets/${walletId}`);
  };

  // Renderizar cada wallet
  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isDefault = item.id === defaultWalletId;
    
    return (
      <TouchableOpacity 
        style={styles.walletCard}
        onPress={() => handleWalletPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <View style={[styles.walletIcon, { backgroundColor: item.color }]}>
              <Text style={styles.walletIconText}>{item.icon}</Text>
            </View>
            <View style={styles.walletDetails}>
              <Text style={styles.walletName}>{item.name}</Text>
              <Text style={styles.walletBalance}>
                ${item.balance.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.walletActions}>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
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
                color={isDefault ? "#FFD700" : "#666"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteWallet(item);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mis Cuentas</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/wallets/add-wallet")}
        >
          <Ionicons name="add" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      {/* Lista de wallets */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando cuentas...</Text>
          </View>
        ) : wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes cuentas</Text>
            <Text style={styles.emptySubtitle}>
              Añade tu primera cuenta para empezar
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.push("/wallets/add-wallet")}
            >
              <Text style={styles.addFirstButtonText}>Añadir cuenta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={wallets}
            renderItem={renderWalletItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: "#7952FC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingVertical: 16,
  },
  walletCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletIconText: {
    fontSize: 20,
    color: "white",
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  walletBalance: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  walletActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#000",
  },
  actionButton: {
    padding: 8,
  },
});
