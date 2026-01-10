import { useObjectives } from "@/contexts/ObjectivesContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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

type ObjectiveType = "savings" | "debt";

export default function AddObjectiveScreen() {
  const router = useRouter();
  const { createObjective } = useObjectives();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [type, setType] = useState<ObjectiveType>("savings");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Ingresa un nombre para el objetivo");
      return;
    }

    const amountNum = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    const currentAmountNum = currentAmount
      ? parseFloat(currentAmount.replace(/,/g, ""))
      : 0;

    setIsSubmitting(true);

    try {
      await createObjective({
        title: title.trim(),
        amount: amountNum,
        current_amount: currentAmountNum,
        type,
        due_date: dueDate ? dueDate.getTime() : undefined,
      });
      router.back();
    } catch (error) {
      console.error("Error creating objective:", error);
      Alert.alert("Error", "No se pudo crear el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calcular meses y pago mensual estimado
  const calculateEstimates = () => {
    const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
    const currentNum = parseFloat(currentAmount.replace(/,/g, "")) || 0;
    const remaining = Math.max(0, amountNum - currentNum);

    if (!dueDate || remaining <= 0) return null;

    const now = Date.now();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const monthsRemaining = Math.max(1, Math.ceil((dueDate.getTime() - now) / msPerMonth));
    const monthlyPayment = remaining / monthsRemaining;

    return {
      monthsRemaining,
      monthlyPayment,
      remaining,
    };
  };

  const estimates = calculateEstimates();

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
        <Text style={styles.headerTitle}>Nuevo Objetivo</Text>
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
          {/* Tipo de Objetivo */}
          <View style={styles.section}>
            <Text style={styles.label}>Tipo de objetivo</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  type === "savings" && styles.typeOptionActive,
                ]}
                onPress={() => setType("savings")}
              >
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={type === "savings" ? "#fff" : "#4CAF50"}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === "savings" && styles.typeOptionTextActive,
                  ]}
                >
                  Meta de Ahorro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  type === "debt" && styles.typeOptionActiveDebt,
                ]}
                onPress={() => setType("debt")}
              >
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={type === "debt" ? "#fff" : "#FF6B6B"}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === "debt" && styles.typeOptionTextActive,
                  ]}
                >
                  Deuda
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nombre */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {type === "savings" ? "Nombre de la meta" : "Nombre de la deuda"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                type === "savings"
                  ? "Ej: Vacaciones, Fondo de emergencia..."
                  : "Ej: Tarjeta de crédito, Préstamo..."
              }
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Monto total */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {type === "savings" ? "Meta a alcanzar" : "Deuda total"}
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.currencyCode}>MXN</Text>
            </View>
          </View>

          {/* Monto actual */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {type === "savings" ? "Ya tienes ahorrado" : "Ya pagaste"}
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={currentAmount}
                onChangeText={setCurrentAmount}
              />
              <Text style={styles.currencyCode}>MXN</Text>
            </View>
          </View>

          {/* Fecha límite */}
          <View style={styles.section}>
            <Text style={styles.label}>Fecha límite (opcional)</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {dueDate ? formatDateDisplay(dueDate) : "Seleccionar fecha"}
              </Text>
              {dueDate && (
                <TouchableOpacity
                  onPress={() => setDueDate(null)}
                  style={styles.clearDateButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}

          {/* Estimaciones */}
          {estimates && (
            <View style={styles.estimatesCard}>
              <View style={styles.estimatesHeader}>
                <Ionicons name="calculator-outline" size={20} color="#7952FC" />
                <Text style={styles.estimatesTitle}>Estimaciones</Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Restante:</Text>
                <Text style={styles.estimateValue}>
                  ${estimates.remaining.toLocaleString("es-MX")}
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Tiempo:</Text>
                <Text style={styles.estimateValue}>
                  {estimates.monthsRemaining} meses
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>
                  {type === "savings" ? "Ahorro mensual:" : "Pago mensual:"}
                </Text>
                <Text style={[styles.estimateValue, { color: "#7952FC" }]}>
                  ${estimates.monthlyPayment.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          )}

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
            {isSubmitting ? "Guardando..." : "Crear Objetivo"}
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  typeOptionActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  typeOptionActiveDebt: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  typeOptionTextActive: {
    color: "#fff",
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
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    paddingVertical: 16,
  },
  currencyCode: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  clearDateButton: {
    padding: 4,
  },
  estimatesCard: {
    backgroundColor: "#F3F0FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  estimatesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  estimatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7952FC",
  },
  estimateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
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
