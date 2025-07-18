import { useAddTransaction } from "@/contexts/AddTransactionContext";
import { Category } from "@/contexts/CategoriesContext";
import { Wallet } from "@/lib/database/sqliteService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheetBase from "./BottomSheetBase";

interface AmountSheetProps {
  category: Category | null;
  transactionType: "expense" | "income";
  onComplete: (amount: string) => void;
  onClose?: () => void;
  visible: boolean;
  amount: string;
  setAmount: (amount: string) => void;
}

export default function AmountSheet({
  category,
  transactionType,
  onComplete,
  onClose,
  visible,
  amount,
  setAmount,
}: AmountSheetProps) {
  // Obtenemos las wallets del contexto
  const {
    wallets,
    selectedWallet,
    setSelectedWallet,
    isLoading: isLoadingWallets,
  } = useAddTransaction();
  const handleNumberPress = (num: string) => {
    if (amount === "0" && num !== ".") {
      setAmount(num);
    } else if (num === "." && amount.includes(".")) {
      return;
    } else {
      setAmount(amount + num);
    }
  };

  const handleDeletePress = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount("0");
    }
  };

  const handleDonePress = () => {
    if (amount !== "0" && selectedWallet) {
      onComplete(amount);
    }
  };

  // Renderizar cada item de wallet
  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isSelected = selectedWallet?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.walletItem, isSelected && styles.selectedWalletItem]}
        onPress={() => setSelectedWallet(item)}
      >
        <View style={[styles.walletIcon, { backgroundColor: item.color }]}>
          <Text style={styles.walletIconText}>{item.icon}</Text>
        </View>
        <View style={styles.walletInfo}>
          <Text style={[styles.walletName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <Text style={styles.walletBalance}>
            ${item.net_balance?.toFixed(2)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#7952FC"
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheetBase
      title="Ingresa el monto"
      visible={visible}
      onClose={onClose}
    >
      {/* Selector de cuenta/wallet */}
      <View style={styles.walletSection}>
        <Text style={styles.sectionTitle}>Selecciona una cuenta</Text>

        {isLoadingWallets ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7952FC" />
            <Text style={styles.loadingText}>Cargando cuentas...</Text>
          </View>
        ) : wallets.length === 0 ? (
          <Text style={styles.noWalletsText}>No hay cuentas disponibles</Text>
        ) : (
          <FlatList
            data={wallets}
            renderItem={renderWalletItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.walletList}
            contentContainerStyle={styles.walletListContent}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            bounces={false}
          />
        )}
      </View>

      <View className="">
        <Text className="text-5xl font-bold text-right">${amount}</Text>
      </View>
      {/* Numeric keypad */}
      <View style={styles.keypadContainer}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
          (key) => (
            <TouchableOpacity
              key={key}
              style={styles.keypadButton}
              onPress={() => {
                if (key === "⌫") {
                  handleDeletePress();
                } else {
                  handleNumberPress(key);
                }
              }}
            >
              <Text style={styles.keypadButtonText}>{key}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <TouchableOpacity
        className="bg-primary py-4 rounded-xl"
        onPress={handleDonePress}
      >
        <Text className="text-white text-center font-bold">Completar</Text>
      </TouchableOpacity>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  walletSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  walletList: {
    maxHeight: 80,
  },
  walletListContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  walletItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    minWidth: 160,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  selectedWalletItem: {
    borderColor: "#7952FC",
    backgroundColor: "rgba(121, 82, 252, 0.1)",
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  walletIconText: {
    fontSize: 18,
    color: "white",
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 14,
    fontWeight: "500",
  },
  walletBalance: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedText: {
    color: "#7952FC",
    fontWeight: "700",
  },
  checkIcon: {
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
  },
  noWalletsText: {
    paddingVertical: 15,
    color: "#666",
    fontStyle: "italic",
  },
  keypadContainer: {
    height: 250,
    backgroundColor: "#64748b", // bg-slate-500
    borderRadius: 12,
    marginVertical: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: 4,
  },
  keypadButton: {
    width: "32%", // Aproximadamente 33% menos padding
    height: "23%", // 4 filas, cada una ocupa ~25% menos padding
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  keypadButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "500",
  },
});
