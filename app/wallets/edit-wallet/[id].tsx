import AnimatedAlert from "@/components/AnimatedAlert";
import AmountBottomSheet from "@/components/views/wallets/AmountBottomSheet";
import CurrencySelector from "@/components/views/wallets/CurrencySelector";
import { useWallets } from "@/contexts/WalletsContext";
import { useSQLiteService } from "@/lib/database/sqliteService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Iconos disponibles para las wallets
const WALLET_ICONS = [
  { icon: "🏦", name: "Banco" },
  { icon: "💳", name: "Tarjeta" },
  { icon: "💰", name: "Efectivo" },
  { icon: "🏧", name: "ATM" },
  { icon: "💎", name: "Inversión" },
  { icon: "🎯", name: "Ahorros" },
  { icon: "📱", name: "Digital" },
  { icon: "🔒", name: "Seguro" },
];

// Colores disponibles
const WALLET_COLORS = [
  "#4CAF50", // Verde
  "#2196F3", // Azul
  "#FF9800", // Naranja
  "#9C27B0", // Morado
  "#F44336", // Rojo
  "#00BCD4", // Cian
  "#795548", // Marrón
  "#607D8B", // Azul gris
];

export default function EditWalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, updateWallet, refreshWallets } = useWallets();
  const { createTransaction } = useSQLiteService();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [originalBalance, setOriginalBalance] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0].icon);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para las alertas animadas
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Estado para el bottom sheet del monto
  const [showAmountSheet, setShowAmountSheet] = useState(false);

  // Cargar datos de la wallet
  useEffect(() => {
    const loadWallet = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const wallet = await getWalletById(id);

        if (wallet) {
          setName(wallet.name);
          setBalance(wallet.net_balance?.toString() || "0");
          setOriginalBalance(wallet.net_balance || 0);
          setSelectedIcon(wallet.icon || WALLET_ICONS[0].icon);
          setSelectedColor(wallet.color || WALLET_COLORS[0]);
          setSelectedCurrency(wallet.currency || "USD");
        }
      } catch (error) {
        console.error("Error loading wallet:", error);
        setShowErrorAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallet();
  }, [id]);

  // Manejar la confirmación del monto desde el bottom sheet
  const handleAmountComplete = (newAmount: string) => {
    setBalance(newAmount);
    setShowAmountSheet(false);
  };

  // Validar formulario
  const isFormValid = () => {
    return (
      name.trim().length > 0 &&
      !isNaN(parseFloat(balance)) &&
      parseFloat(balance) >= 0
    );
  };

  // Manejar actualización de wallet
  const handleUpdateWallet = async () => {
    if (!isFormValid() || !id) {
      setShowValidationAlert(true);
      return;
    }

    try {
      setIsSaving(true);

      const newBalance = parseFloat(balance);
      const balanceDifference = newBalance - originalBalance;

      // Actualizar la wallet
      await updateWallet(id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        currency: selectedCurrency,
      });

      // Si hay diferencia en el balance, crear una transacción de ajuste
      if (balanceDifference !== 0) {
        const transactionType = balanceDifference > 0 ? "income" : "expense";
        const transactionAmount = Math.abs(balanceDifference);

        await createTransaction({
          wallet_id: id,
          amount: transactionAmount,
          type: transactionType,
          title: "Ajuste de balance",
          note: `Ajuste de balance de ${originalBalance} a ${newBalance}`,
          timestamp: Date.now(),
        });
      }

      // Refrescar las wallets
      await refreshWallets();

      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error al actualizar wallet:", error);
      setShowErrorAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
          <Text style={styles.loadingText}>Cargando cuenta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Editar Cuenta</Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            !isFormValid() && styles.saveButtonDisabled,
          ]}
          onPress={handleUpdateWallet}
          disabled={!isFormValid() || isSaving}
        >
          <Text
            style={[
              styles.saveButtonText,
              !isFormValid() && styles.saveButtonTextDisabled,
            ]}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <View style={styles.section}>
          <TextInput
            style={styles.textInput}
            placeholder="Nombre de la cuenta"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Balance actual */}
        <View style={styles.section}>
          <Text style={styles.amountSectionText}>Balance actual</Text>
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => setShowAmountSheet(true)}
          >
            <Text style={styles.amountButtonText}>${balance}</Text>
          </TouchableOpacity>
          {parseFloat(balance) !== originalBalance && (
            <View style={styles.balanceWarning}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.balanceWarningText}>
                Se creará una transacción de ajuste de{" "}
                {parseFloat(balance) > originalBalance ? "ingreso" : "gasto"} por $
                {Math.abs(parseFloat(balance) - originalBalance).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Selector de moneda */}
        <CurrencySelector
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
        />

        {/* Selección de icono */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icono</Text>
          <View style={styles.iconGrid}>
            {WALLET_ICONS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.iconOption,
                  selectedIcon === item.icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(item.icon)}
              >
                <Text style={styles.iconOptionText}>{item.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selección de color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorGrid}>
            {WALLET_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Alertas animadas */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Éxito!"
        message="La cuenta ha sido actualizada correctamente"
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
        message="No se pudo actualizar la cuenta. Inténtalo de nuevo."
        confirmText="OK"
        confirmButtonColor="#F44336"
        onConfirm={() => setShowErrorAlert(false)}
      />

      <AnimatedAlert
        visible={showValidationAlert}
        title="Campos incompletos"
        message="Por favor completa todos los campos correctamente"
        confirmText="OK"
        confirmButtonColor="#FF9800"
        onConfirm={() => setShowValidationAlert(false)}
      />

      {/* Bottom sheet para el monto */}
      <AmountBottomSheet
        visible={showAmountSheet}
        amount={balance}
        onAmountChange={setBalance}
        onClose={() => setShowAmountSheet(false)}
        onComplete={handleAmountComplete}
      />
    </SafeAreaView>
  );
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#7952FC",
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonTextDisabled: {
    color: "#666",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#7952FC",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 16,
    fontSize: 20,
    backgroundColor: "transparent",
    fontWeight: "500",
    color: "#333",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    borderColor: "#7952FC",
    backgroundColor: "#f0f0ff",
  },
  iconOptionText: {
    fontSize: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
  },
  amountSectionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  amountButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  amountButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#7952FC",
  },
  balanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  balanceWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#E65100",
  },
});
