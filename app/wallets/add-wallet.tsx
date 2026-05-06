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
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";

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

const WALLET_COLORS = [
  "#4CAF50", "#2196F3", "#FF9800", "#9C27B0",
  "#F44336", "#00BCD4", "#795548", "#607D8B",
];

export default function AddWalletScreen() {
  const { theme, accent } = useTheme();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0].icon);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState("MXN");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showAmountSheet, setShowAmountSheet] = useState(false);

  const router = useRouter();
  const { createWallet } = useWallets();

  const handleAmountComplete = (newAmount: string) => {
    setBalance(newAmount);
    setShowAmountSheet(false);
  };

  const isFormValid = () => {
    return name.trim().length > 0 && !isNaN(parseFloat(balance)) && parseFloat(balance) >= 0;
  };

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
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <DesignIcon.Back size={22} color={theme.text} strokeWidth={1.7} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Nueva Cuenta</Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: isFormValid() ? accent : theme.surfaceAlt, borderRadius: 8 }
            ]}
            onPress={handleCreateWallet}
            disabled={!isFormValid() || isLoading}
          >
            <Text style={[styles.saveButtonText, { color: isFormValid() ? "#fff" : theme.textTer }]}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Nombre de la cuenta"
              placeholderTextColor={theme.textTer}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.amountSectionText, { color: theme.textSec }]}>A partir de</Text>
            <TouchableOpacity
              style={[styles.amountButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowAmountSheet(true)}
            >
              <Text style={[styles.amountButtonText, { color: accent }]}>${balance}</Text>
            </TouchableOpacity>
          </View>

          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onSelectCurrency={setSelectedCurrency}
          />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Icono</Text>
            <View style={styles.iconGrid}>
              {WALLET_ICONS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    { backgroundColor: theme.surfaceAlt },
                    selectedIcon === item.icon && [styles.iconOptionSelected, { borderColor: accent }],
                  ]}
                  onPress={() => setSelectedIcon(item.icon)}
                >
                  <Text style={styles.iconOptionText}>{item.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Color</Text>
            <View style={styles.colorGrid}>
              {WALLET_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && [styles.colorOptionSelected, { borderColor: theme.text }],
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

        <AnimatedAlert
          visible={showSuccessAlert}
          title="¡Éxito!"
          message="La cuenta ha sido creada correctamente"
          confirmText="OK"
          confirmButtonColor={theme.good}
          onConfirm={() => { setShowSuccessAlert(false); router.back(); }}
        />

        <AnimatedAlert
          visible={showErrorAlert}
          title="Error"
          message="No se pudo crear la cuenta. Inténtalo de nuevo."
          confirmText="OK"
          confirmButtonColor={theme.bad}
          onConfirm={() => setShowErrorAlert(false)}
        />

        <AnimatedAlert
          visible={showValidationAlert}
          title="Campos incompletos"
          message="Por favor completa todos los campos correctamente"
          confirmText="OK"
          confirmButtonColor={accent}
          onConfirm={() => setShowValidationAlert(false)}
        />

        <AmountBottomSheet
          visible={showAmountSheet}
          amount={balance}
          onAmountChange={setBalance}
          onClose={() => setShowAmountSheet(false)}
          onComplete={handleAmountComplete}
        />
      </KeyboardAvoidingView>
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
  saveButton: { paddingHorizontal: 16, paddingVertical: 8 },
  saveButtonText: { fontSize: 14, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  amountSectionText: { fontSize: 13, textAlign: "center", marginBottom: 8 },
  amountButton: { borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1 },
  amountButtonText: { fontSize: 24, fontWeight: "bold" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  iconOption: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  iconOptionSelected: { borderWidth: 2 },
  iconOptionText: { fontSize: 20 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorOption: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  colorOptionSelected: {},
});