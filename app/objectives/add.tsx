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
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";

type ObjectiveType = "savings" | "debt";

export default function AddObjectiveScreen() {
  const { theme, accent } = useTheme();
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
    const currentAmountNum = currentAmount ? parseFloat(currentAmount.replace(/,/g, "")) : 0;
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
      Alert.alert("Error", "No se pudo crear el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  };

  const calculateEstimates = () => {
    const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
    const currentNum = parseFloat(currentAmount.replace(/,/g, "")) || 0;
    const remaining = Math.max(0, amountNum - currentNum);
    if (!dueDate || remaining <= 0) return null;
    const now = Date.now();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const monthsRemaining = Math.max(1, Math.ceil((dueDate.getTime() - now) / msPerMonth));
    const monthlyPayment = remaining / monthsRemaining;
    return { monthsRemaining, monthlyPayment, remaining };
  };

  const estimates = calculateEstimates();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <DesignIcon.Close size={22} color={theme.text} strokeWidth={1.7} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nuevo Objetivo</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Tipo de objetivo</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  type === "savings" && [styles.typeOptionActive, { backgroundColor: theme.good, borderColor: theme.good }],
                ]}
                onPress={() => setType("savings")}
              >
                <DesignIcon.Wallet size={20} color={type === "savings" ? "#fff" : theme.good} strokeWidth={1.6} />
                <Text style={[styles.typeOptionText, { color: type === "savings" ? "#fff" : theme.text }]}>Meta de Ahorro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  type === "debt" && [styles.typeOptionActive, { backgroundColor: theme.bad, borderColor: theme.bad }],
                ]}
                onPress={() => setType("debt")}
              >
                <DesignIcon.Card size={20} color={type === "debt" ? "#fff" : theme.bad} strokeWidth={1.6} />
                <Text style={[styles.typeOptionText, { color: type === "debt" ? "#fff" : theme.text }]}>Deuda</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              {type === "savings" ? "Nombre de la meta" : "Nombre de la deuda"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder={type === "savings" ? "Ej: Vacaciones, Fondo de emergencia..." : "Ej: Tarjeta de crédito, Préstamo..."}
              placeholderTextColor={theme.textTer}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              {type === "savings" ? "Meta a alcanzar" : "Deuda total"}
            </Text>
            <View style={[styles.amountInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.textSec }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.textTer}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={[styles.currencyCode, { color: theme.textTer }]}>MXN</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              {type === "savings" ? "Ya tienes ahorrado" : "Ya pagaste"}
            </Text>
            <View style={[styles.amountInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.textSec }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.textTer}
                keyboardType="decimal-pad"
                value={currentAmount}
                onChangeText={setCurrentAmount}
              />
              <Text style={[styles.currencyCode, { color: theme.textTer }]}>MXN</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Fecha límite (opcional)</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.textTer} />
              <Text style={[styles.dateButtonText, { color: dueDate ? theme.text : theme.textTer }]}>
                {dueDate ? formatDateDisplay(dueDate) : "Seleccionar fecha"}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <Ionicons name="close-circle" size={20} color={theme.textTer} />
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
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
            />
          )}

          {estimates && (
            <View style={[styles.estimatesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.estimatesHeader}>
                <Ionicons name="calculator-outline" size={18} color={accent} />
                <Text style={[styles.estimatesTitle, { color: accent }]}>Estimaciones</Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.textSec }]}>Restante:</Text>
                <Text style={[styles.estimateValue, { color: theme.text }]}>
                  ${estimates.remaining.toLocaleString("es-MX")}
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.textSec }]}>Tiempo:</Text>
                <Text style={[styles.estimateValue, { color: theme.text }]}>{estimates.monthsRemaining} meses</Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.textSec }]}>
                  {type === "savings" ? "Ahorro mensual:" : "Pago mensual:"}
                </Text>
                <Text style={[styles.estimateValue, { color: accent }]}>
                  ${estimates.monthlyPayment.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: accent }, isSubmitting && { opacity: 0.6 }]}
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
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  typeSelector: { flexDirection: "row", gap: 12 },
  typeOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  typeOptionActive: {},
  typeOptionText: { fontSize: 13, fontWeight: "600" },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15 },
  amountInputContainer: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, paddingHorizontal: 14, borderWidth: 1,
  },
  currencySymbol: { fontSize: 18, fontWeight: "600", marginRight: 6 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: "600", paddingVertical: 14 },
  currencyCode: { fontSize: 13, marginLeft: 6 },
  dateButton: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 10,
  },
  dateButtonText: { flex: 1, fontSize: 15 },
  estimatesCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginTop: 8 },
  estimatesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  estimatesTitle: { fontSize: 14, fontWeight: "600" },
  estimateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  estimateLabel: { fontSize: 13 },
  estimateValue: { fontSize: 14, fontWeight: "600" },
  footer: {
    padding: 16, borderTopWidth: 0.5,
  },
  submitButton: { borderRadius: 14, padding: 16, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});