import AnimatedAlert from "@/components/AnimatedAlert";
import AmountBottomSheet from "@/components/views/wallets/AmountBottomSheet";
import CurrencySelector from "@/components/views/wallets/CurrencySelector";
import { useWallets } from "@/contexts/WalletsContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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

export default function AddWalletScreen() {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0].icon);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para las alertas animadas
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Estado para el bottom sheet del monto
  const [showAmountSheet, setShowAmountSheet] = useState(false);

  const router = useRouter();
  const { createWallet } = useWallets();

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

  // Manejar creación de wallet
  const handleCreateWallet = async () => {
    if (!isFormValid()) {
      setShowValidationAlert(true);
      return;
    }

    try {
      setIsLoading(true);

      await createWallet({
        name: name.trim(),
        balance: parseFloat(balance),
        icon: selectedIcon,
        color: selectedColor,
        currency: selectedCurrency,
      });

      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error al crear wallet:", error);
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Nueva Cuenta</Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            !isFormValid() && styles.saveButtonDisabled,
          ]}
          onPress={handleCreateWallet}
          disabled={!isFormValid() || isLoading}
        >
          <Text
            style={[
              styles.saveButtonText,
              !isFormValid() && styles.saveButtonTextDisabled,
            ]}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        {/* Balance inicial */}
        <View style={styles.section}>
          <Text style={styles.amountSectionText}>A partir de</Text>
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => setShowAmountSheet(true)}
          >
            <Text style={styles.amountButtonText}>${balance}</Text>
          </TouchableOpacity>
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
      </KeyboardAvoidingView>

      {/* Alertas animadas */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Éxito!"
        message="La cuenta ha sido creada correctamente"
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
        message="No se pudo crear la cuenta. Inténtalo de nuevo."
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
  previewSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },

  section: {
    marginBottom: 24,
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
});
