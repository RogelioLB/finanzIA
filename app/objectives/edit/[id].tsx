import { useObjectives } from "@/contexts/ObjectivesContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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

type ObjectiveType = "savings" | "debt";

export default function EditObjectiveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getObjectiveById, updateObjective, deleteObjective, addProgress } = useObjectives();

  const objective = getObjectiveById(id);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [type, setType] = useState<ObjectiveType>("savings");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressAmount, setProgressAmount] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    if (objective) {
      setTitle(objective.title);
      setAmount(objective.amount.toString());
      setCurrentAmount(objective.current_amount.toString());
      setType(objective.type);
      setDueDate(objective.due_date ? new Date(objective.due_date) : null);
    }
  }, [objective]);

  if (!objective) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Objetivo no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

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
      await updateObjective(id, {
        title: title.trim(),
        amount: amountNum,
        current_amount: currentAmountNum,
        type,
        due_date: dueDate ? dueDate.getTime() : undefined,
      });
      router.back();
    } catch (error) {
      console.error("Error updating objective:", error);
      Alert.alert("Error", "No se pudo actualizar el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar objetivo",
      "¿Estás seguro de que deseas eliminar este objetivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteObjective(id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el objetivo");
            }
          },
        },
      ]
    );
  };

  const handleAddProgress = async () => {
    const progressNum = parseFloat(progressAmount.replace(/,/g, ""));
    if (isNaN(progressNum) || progressNum <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    try {
      await addProgress(id, progressNum);
      setProgressAmount("");
      setShowProgressModal(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar el progreso");
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calcular estimaciones
  const calculateEstimates = () => {
    const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
    const currentNum = parseFloat(currentAmount.replace(/,/g, "")) || 0;
    const remaining = Math.max(0, amountNum - currentNum);
    const progress = amountNum > 0 ? (currentNum / amountNum) * 100 : 0;

    if (!dueDate || remaining <= 0) {
      return { remaining, progress, monthsRemaining: 0, monthlyPayment: 0 };
    }

    const now = Date.now();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const monthsRemaining = Math.max(1, Math.ceil((dueDate.getTime() - now) / msPerMonth));
    const monthlyPayment = remaining / monthsRemaining;

    return {
      remaining,
      progress,
      monthsRemaining,
      monthlyPayment,
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
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Objetivo</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
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
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progreso</Text>
              <Text style={styles.progressPercentage}>
                {estimates.progress.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, estimates.progress)}%` },
                ]}
              />
            </View>
            <View style={styles.progressDetails}>
              <Text style={styles.progressText}>
                ${parseFloat(currentAmount || "0").toLocaleString("es-MX")} de $
                {parseFloat(amount || "0").toLocaleString("es-MX")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addProgressButton}
              onPress={() => setShowProgressModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#7952FC" />
              <Text style={styles.addProgressButtonText}>
                {type === "savings" ? "Agregar ahorro" : "Registrar pago"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Modal */}
          {showProgressModal && (
            <View style={styles.progressModal}>
              <Text style={styles.progressModalTitle}>
                {type === "savings" ? "Agregar ahorro" : "Registrar pago"}
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={progressAmount}
                  onChangeText={setProgressAmount}
                  autoFocus
                />
              </View>
              <View style={styles.progressModalButtons}>
                <TouchableOpacity
                  style={styles.progressModalCancel}
                  onPress={() => {
                    setProgressAmount("");
                    setShowProgressModal(false);
                  }}
                >
                  <Text style={styles.progressModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.progressModalConfirm}
                  onPress={handleAddProgress}
                >
                  <Text style={styles.progressModalConfirmText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
          {estimates.monthlyPayment > 0 && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: "700",
    color: "#7952FC",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7952FC",
    borderRadius: 6,
  },
  progressDetails: {
    alignItems: "center",
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
  },
  addProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
  },
  addProgressButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7952FC",
  },
  progressModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#7952FC",
  },
  progressModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  progressModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  progressModalCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  progressModalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressModalConfirm: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#7952FC",
    alignItems: "center",
  },
  progressModalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
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
