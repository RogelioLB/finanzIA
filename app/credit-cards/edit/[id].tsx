import CreditCard from "@/components/CreditCard";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function EditCreditCardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creditCards, updateCreditCard, deleteCreditCard } = useCreditCards();

  const card = creditCards.find((c) => c.id === id);

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

  useEffect(() => {
    if (card) {
      setName(card.name);
      setBank(card.bank || "");
      setLastFourDigits(card.last_four_digits || "");
      setCreditLimit(card.credit_limit.toString());
      setCurrentBalance(card.current_balance.toString());
      setCutOffDay(card.cut_off_day.toString());
      setPaymentDueDay(card.payment_due_day.toString());
      setInterestRate(card.interest_rate?.toString() || "");
      setColor(card.color || CARD_COLORS[0]);
    }
  }, [card]);

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tarjeta no encontrada</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="card-outline" size={64} color="#D1D5DB" />
          <Text style={styles.notFoundText}>
            No se encontró la tarjeta solicitada
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
      await updateCreditCard(id, {
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
      console.error("Error updating credit card:", error);
      Alert.alert("Error", "No se pudo actualizar la tarjeta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Tarjeta",
      `¿Estás seguro de que deseas eliminar "${card.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCreditCard(id);
              router.back();
            } catch (error) {
              console.error("Error deleting credit card:", error);
              Alert.alert("Error", "No se pudo eliminar la tarjeta");
            }
          },
        },
      ]
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
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Tarjeta</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
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
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
  deleteButton: {
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
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notFoundText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
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
