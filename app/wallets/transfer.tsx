import AnimatedAlert from "@/components/AnimatedAlert";
import AmountBottomSheet from "@/components/views/wallets/AmountBottomSheet";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useSQLiteService, Wallet } from "@/lib/database/sqliteService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransferScreen() {
  const router = useRouter();
  const { wallets, refreshWallets } = useWallets();
  const {refreshTransactions} = useTransactions()
  const { createTransaction } = useSQLiteService();

  const [leftWallet, setLeftWallet] = useState<Wallet | null>(null);
  const [rightWallet, setRightWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false); // Track if wallets are swapped

  // Estados para sheets
  const [showAmountSheet, setShowAmountSheet] = useState(false);
  const [showLeftWalletSheet, setShowLeftWalletSheet] = useState(false);
  const [showRightWalletSheet, setShowRightWalletSheet] = useState(false);

  // Estados para alertas
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Animación para la flecha
  const arrowRotation = useSharedValue(0);

  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${arrowRotation.value}deg` }],
    };
  });

  // Determinar cuál es origen y cuál es destino basado en isSwapped
  const fromWallet = isSwapped ? rightWallet : leftWallet;
  const toWallet = isSwapped ? leftWallet : rightWallet;

  // Intercambiar wallets (solo cambia la dirección, no las posiciones visuales)
  const handleSwapWallets = () => {
    if (!leftWallet || !rightWallet) return;

    // Cambiar el estado de intercambio
    setIsSwapped(!isSwapped);

    // Animar solo la flecha
    arrowRotation.value = withSpring(arrowRotation.value + 180, {
      damping: 15,
      stiffness: 150,
    });
  };

  // Filtrar wallets disponibles
  const availableLeftWallets = wallets.filter(
    (w) => w.id !== rightWallet?.id
  );

  const availableRightWallets = wallets.filter((w) => w.id !== leftWallet?.id);

  // Validar formulario
  const isFormValid = () => {
    if (!fromWallet || !toWallet || !amount) return false;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return false;
    if (amountNum > (fromWallet.net_balance || 0)) return false;
    return true;
  };

  // Manejar transferencia
  const handleTransfer = async () => {
    if (!isFormValid() || !fromWallet || !toWallet) {
      setErrorMessage("Por favor completa todos los campos correctamente");
      setShowValidationAlert(true);
      return;
    }

    const amountNum = parseFloat(amount);

    try {
      setIsProcessing(true);

      // Crear transacción de salida
      await createTransaction({
        wallet_id: fromWallet.id,
        amount: amountNum,
        type: "expense",
        title: "Transferencia enviada",
        note: note.trim() || `Transferencia a ${toWallet.name}`,
        timestamp: Date.now(),
        to_wallet_id: toWallet.id,
      });

      await createTransaction({
        wallet_id: toWallet.id,
        amount: amountNum,
        type: "income",
        title: "Transferencia recibida",
        note: note.trim() || `Transferencia de ${fromWallet.name}`,
        timestamp: Date.now(),
        to_wallet_id: fromWallet.id,
      });

      // Refrescar wallets
      await refreshWallets();
      await refreshTransactions();

      // Limpiar formulario
      setLeftWallet(null);
      setRightWallet(null);
      setAmount("0");
      setNote("");
      setIsSwapped(false);
      arrowRotation.value = 0;

      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error al realizar transferencia:", error);
      setErrorMessage("No se pudo completar la transferencia");
      setShowErrorAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mostrar mensaje si no hay wallets suficientes
  if (wallets.length < 2) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transferir</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="swap-horizontal-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {wallets.length === 0 ? "No hay cuentas" : "Necesitas más cuentas"}
          </Text>
          <Text style={styles.emptyText}>
            Necesitas al menos 2 cuentas para realizar transferencias
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/wallets/add-wallet")}
          >
            <Text style={styles.createButtonText}>
              {wallets.length === 0 ? "Crear Cuenta" : "Crear Otra Cuenta"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transferir</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Amount Section */}
      <TouchableOpacity
        style={styles.amountSection}
        onPress={() => setShowAmountSheet(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.amountLabel}>Monto</Text>
        <Text style={styles.amountText}>${amount}</Text>
      </TouchableOpacity>

      {/* Wallets Selection */}
      <View style={styles.walletsContainer}>
        {/* Left Wallet */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => setShowLeftWalletSheet(true)}
          activeOpacity={0.7}
        >
          {leftWallet ? (
            <>
              <View
                style={[styles.walletIconContainer, { backgroundColor: leftWallet.color }]}
              >
                <Text style={styles.walletIcon}>{leftWallet.icon}</Text>
              </View>
              <Text style={styles.walletName}>{leftWallet.name}</Text>
              <Text style={styles.walletBalance}>
                ${leftWallet.net_balance?.toFixed(2)}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.walletIconContainer}>
                <Ionicons name="add" size={32} color="#666" />
              </View>
              <Text style={styles.walletPlaceholder}>Desde</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Arrow Button */}
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={handleSwapWallets}
          disabled={!fromWallet || !toWallet}
        >
          <Animated.View style={arrowAnimatedStyle}>
            <Ionicons
              name="arrow-forward"
              size={24}
              color={fromWallet && toWallet ? "#7952FC" : "#ccc"}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Right Wallet */}
        <TouchableOpacity
          style={styles.walletCard}
          onPress={() => setShowRightWalletSheet(true)}
          activeOpacity={0.7}
        >
          {rightWallet ? (
            <>
              <View
                style={[styles.walletIconContainer, { backgroundColor: rightWallet.color }]}
              >
                <Text style={styles.walletIcon}>{rightWallet.icon}</Text>
              </View>
              <Text style={styles.walletName}>{rightWallet.name}</Text>
              <Text style={styles.walletBalance}>
                ${rightWallet.net_balance?.toFixed(2)}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.walletIconContainer}>
                <Ionicons name="add" size={32} color="#666" />
              </View>
              <Text style={styles.walletPlaceholder}>Hacia</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Note Section */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Nota (opcional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Agregar una nota..."
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Transfer Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.transferButton,
            (!isFormValid() || isProcessing) && styles.transferButtonDisabled,
          ]}
          onPress={handleTransfer}
          disabled={!isFormValid() || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.transferButtonText}>Transferir</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Amount Sheet */}
      <AmountBottomSheet
        visible={showAmountSheet}
        amount={amount}
        onAmountChange={setAmount}
        onClose={() => setShowAmountSheet(false)}
        onComplete={(newAmount) => {
          setAmount(newAmount);
          setShowAmountSheet(false);
        }}
      />

      {/* Left Wallet Sheet */}
      <WalletSelectionSheet
        visible={showLeftWalletSheet}
        wallets={availableLeftWallets}
        selectedWallet={leftWallet}
        onSelect={(wallet) => {
          setLeftWallet(wallet);
          setShowLeftWalletSheet(false);
        }}
        onClose={() => setShowLeftWalletSheet(false)}
        title="Selecciona cuenta"
      />

      {/* Right Wallet Sheet */}
      <WalletSelectionSheet
        visible={showRightWalletSheet}
        wallets={availableRightWallets}
        selectedWallet={rightWallet}
        onSelect={(wallet) => {
          setRightWallet(wallet);
          setShowRightWalletSheet(false);
        }}
        onClose={() => setShowRightWalletSheet(false)}
        title="Selecciona cuenta"
      />

      {/* Alertas */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Transferencia exitosa!"
        message="La transferencia se ha completado correctamente"
        confirmText="OK"
        confirmButtonColor="#4CAF50"
        onConfirm={() => {
          setShowSuccessAlert(false);
          router.back();
        }}
      />

      <AnimatedAlert
        visible={showErrorAlert}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        confirmButtonColor="#F44336"
        onConfirm={() => setShowErrorAlert(false)}
      />

      <AnimatedAlert
        visible={showValidationAlert}
        title="Datos incompletos"
        message={errorMessage}
        confirmText="OK"
        confirmButtonColor="#FF9800"
        onConfirm={() => setShowValidationAlert(false)}
      />
    </View>
  );
}

// Componente para el sheet de selección de wallet
interface WalletSelectionSheetProps {
  visible: boolean;
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  onSelect: (wallet: Wallet) => void;
  onClose: () => void;
  title: string;
}

function WalletSelectionSheet({
  visible,
  wallets,
  selectedWallet,
  onSelect,
  onClose,
  title,
}: WalletSelectionSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.sheetOverlay}>
      <TouchableOpacity
        style={styles.sheetBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.sheetWalletItem,
                selectedWallet?.id === wallet.id && styles.sheetWalletItemSelected,
              ]}
              onPress={() => onSelect(wallet)}
            >
              <View
                style={[styles.sheetWalletIcon, { backgroundColor: wallet.color }]}
              >
                <Text style={styles.walletIcon}>{wallet.icon}</Text>
              </View>
              <View style={styles.sheetWalletInfo}>
                <Text style={styles.sheetWalletName}>{wallet.name}</Text>
                <Text style={styles.sheetWalletBalance}>
                  ${wallet.net_balance?.toFixed(2)}
                </Text>
              </View>
              {selectedWallet?.id === wallet.id && (
                <Ionicons name="checkmark-circle" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
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
    paddingTop: 48,
    paddingBottom: 12,
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
  amountSection: {
    backgroundColor: "#7952FC20",
    padding: 24,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#7952FC",
  },
  walletsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  walletCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#eee",
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  walletIcon: {
    fontSize: 28,
  },
  walletName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  walletBalance: {
    fontSize: 12,
    color: "#666",
  },
  walletPlaceholder: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  arrowButton: {
    marginHorizontal: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  noteSection: {
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
    color: "#000",
    minHeight: 80,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  transferButton: {
    backgroundColor: "#7952FC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  transferButtonDisabled: {
    backgroundColor: "#ccc",
  },
  transferButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  createButton: {
    backgroundColor: "#7952FC",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Sheet styles
  sheetOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  sheetContent: {
    padding: 16,
  },
  sheetWalletItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  sheetWalletItemSelected: {
    backgroundColor: "#7952FC20",
    borderWidth: 2,
    borderColor: "#7952FC",
  },
  sheetWalletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sheetWalletInfo: {
    flex: 1,
  },
  sheetWalletName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sheetWalletBalance: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
