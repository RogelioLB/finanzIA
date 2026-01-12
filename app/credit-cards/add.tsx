import CreditCard from "@/components/CreditCard";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const CARD_COLORS = [
  "#1E3A8A", // Azul oscuro
  "#7952FC", // Morado
  "#059669", // Verde
  "#DC2626", // Rojo
  "#D97706", // Naranja
  "#7C3AED", // Violeta
  "#0891B2", // Cyan
  "#BE185D", // Rosa
];

export default function AddCreditCardScreen() {
  const router = useRouter();
  const { createCreditCard } = useCreditCards();

  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [cutOffDay, setCutOffDay] = useState("15");
  const [paymentDueDay, setPaymentDueDay] = useState("5");
  const [interestRate, setInterestRate] = useState("");
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la tarjeta");
      return;
    }

    const limitNum = parseFloat(creditLimit.replace(/,/g, ""));
    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert("Error", "Ingresa un límite de crédito válido");
      return;
    }

    const cutOff = parseInt(cutOffDay);
    const paymentDue = parseInt(paymentDueDay);
    if (cutOff < 1 || cutOff > 31 || paymentDue < 1 || paymentDue > 31) {
      Alert.alert("Error", "Los días de corte y pago deben estar entre 1 y 31");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCreditCard({
        name: name.trim(),
        bank: bank.trim() || undefined,
        last_four_digits: lastFourDigits.trim() || undefined,
        credit_limit: limitNum,
        current_balance: currentBalance
          ? parseFloat(currentBalance.replace(/,/g, ""))
          : 0,
        cut_off_day: cutOff,
        payment_due_day: paymentDue,
        interest_rate: interestRate
          ? parseFloat(interestRate.replace(/,/g, ""))
          : undefined,
        color,
      });
      router.back();
    } catch (error) {
      console.error("Error creating credit card:", error);
      Alert.alert("Error", "No se pudo crear la tarjeta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Tarjeta</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={styles.previewContainer}>
            <CreditCard
              name={name}
              bank={bank}
              lastFourDigits={lastFourDigits}
              color={color}
            />
          </View>

          {/* Color Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {CARD_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nombre */}
          <View style={styles.section}>
            <Text style={styles.label}>Nombre de la tarjeta *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Tarjeta Oro, Platino..."
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Banco */}
          <View style={styles.section}>
            <Text style={styles.label}>Banco</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: BBVA, Santander, Banamex..."
              placeholderTextColor="#9CA3AF"
              value={bank}
              onChangeText={setBank}
            />
          </View>

          {/* Últimos 4 dígitos */}
          <View style={styles.section}>
            <Text style={styles.label}>Últimos 4 dígitos</Text>
            <TextInput
              style={styles.input}
              placeholder="1234"
              placeholderTextColor="#9CA3AF"
              value={lastFourDigits}
              onChangeText={(text) => setLastFourDigits(text.slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Límite de crédito */}
          <View style={styles.section}>
            <Text style={styles.label}>Límite de crédito *</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={creditLimit}
                onChangeText={setCreditLimit}
              />
            </View>
          </View>

          {/* Saldo actual */}
          <View style={styles.section}>
            <Text style={styles.label}>Saldo actual</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={currentBalance}
                onChangeText={setCurrentBalance}
              />
            </View>
          </View>

          {/* Fechas */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Día de corte *</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={cutOffDay}
                onChangeText={setCutOffDay}
                maxLength={2}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Día de pago *</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={paymentDueDay}
                onChangeText={setPaymentDueDay}
                maxLength={2}
              />
            </View>
          </View>

          {/* Tasa de interés */}
          <View style={styles.section}>
            <Text style={styles.label}>Tasa de interés anual (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="36.5"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={interestRate}
              onChangeText={setInterestRate}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Botón Guardar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Guardando..." : "Crear Tarjeta"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    paddingVertical: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#7952FC",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
