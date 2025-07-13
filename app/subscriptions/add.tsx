import AnimatedAlert from "@/components/AnimatedAlert";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useAccounts } from "@/hooks/useAccounts";
import { SubscriptionFrequency } from "@/lib/models/types";
import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { addSubscription, calculateNextPaymentDate } = useSubscriptions();
  const { accounts } = useAccounts();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("monthly");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allowNotifications, setAllowNotifications] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Seleccionar la primera cuenta disponible por defecto
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSave = useCallback(async () => {
    try {
      // Ocultar teclado
      Keyboard.dismiss();

      // Validaciones
      if (!name.trim()) {
        setError("Ingresa un nombre para la suscripción");
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Ingresa un monto válido");
        return;
      }

      if (!accountId) {
        setError("Selecciona una cuenta");
        return;
      }

      // Crear la suscripción
      await addSubscription({
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        next_payment_date: nextPaymentDate.getTime(),
        account_id: accountId,
        description: description.trim() || undefined,
        allow_notifications: allowNotifications ? 1 : 0,
      });

      setShowSuccessAlert(true);
    } catch (error) {
      setError("Error al guardar la suscripción");
    }
  }, [
    name,
    amount,
    frequency,
    accountId,
    description,
    nextPaymentDate,
    allowNotifications,
    addSubscription,
  ]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNextPaymentDate(selectedDate);
    }
  };

  const handleFrequencyChange = (value: SubscriptionFrequency) => {
    setFrequency(value);
    // Actualizar la fecha del próximo pago según la frecuencia
    const newDate = new Date();
    setNextPaymentDate(new Date(calculateNextPaymentDate(value, newDate)));
  };

  return (
    <>
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Suscripción agregada!"
        message="La suscripción ha sido guardada exitosamente"
        confirmText="Aceptar"
        confirmButtonColor="#38C172"
        onConfirm={() => {
          setShowSuccessAlert(false);
          router.back();
        }}
      />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Nueva Suscripción</Text>
            <Text style={styles.subtitle}>Agrega un nuevo pago recurrente</Text>
          </View>
        </View>

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Netflix, Spotify, Gimnasio..."
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={frequency}
                onValueChange={(value) =>
                  handleFrequencyChange(value as SubscriptionFrequency)
                }
                style={styles.picker}
                itemStyle={{ color: "#000" }}
              >
                <Picker.Item label="Diario" value="daily" />
                <Picker.Item label="Semanal" value="weekly" />
                <Picker.Item label="Mensual" value="monthly" />
                <Picker.Item label="Anual" value="yearly" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cuenta</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={accountId}
                onValueChange={setAccountId}
                style={styles.picker}
                itemStyle={{ color: "#000" }}
                enabled={accounts.length > 0}
              >
                {accounts.map((account) => (
                  <Picker.Item
                    key={account.id}
                    label={`${account.name} (${account.balance})`}
                    value={account.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Próximo pago</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(nextPaymentDate, "dd/MM/yyyy")}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#666" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={nextPaymentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Agrega detalles adicionales..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Permitir notificaciones</Text>
            <Switch
              value={allowNotifications}
              onValueChange={setAllowNotifications}
              trackColor={{ false: "#ddd", true: "#c9b8ff" }}
              thumbColor={allowNotifications ? "#7952FC" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Suscripción</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: "#FFEDED",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  errorText: {
    color: "#D63031",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  picker: {
    height: 50,
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: "#7952FC",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
