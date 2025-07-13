import AnimatedAlert from "@/components/AnimatedAlert";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useAccounts } from "@/hooks/useAccounts";
import { Subscription, SubscriptionFrequency } from "@/lib/models/types";
import { formatCurrency } from "@/lib/utils";
import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accounts } = useAccounts();
  const { updateSubscription, getSubscription } = useSubscriptions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("monthly");
  const [accountId, setAccountId] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
  const [allowNotifications, setAllowNotifications] = useState(true);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          const subscriptionData = await getSubscription(id);
          if (subscriptionData) {
            setSubscription(subscriptionData);
            setName(subscriptionData.name);
            setAmount(subscriptionData.amount.toString());
            setDescription(subscriptionData.description || "");
            setFrequency(subscriptionData.frequency);
            setAccountId(subscriptionData.account_id);
            setNextPaymentDate(new Date(subscriptionData.next_payment_date));
            setAllowNotifications(subscriptionData.allow_notifications === 1);
          } else {
            Alert.alert("Error", "No se encontró la suscripción");
            router.back();
          }
        } catch (e) {
          Alert.alert("Error", "Error al cargar la suscripción");
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [id, getSubscription, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa un nombre para la suscripción");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Por favor ingresa un monto válido");
      return;
    }

    if (!accountId) {
      Alert.alert("Error", "Por favor selecciona una cuenta");
      return;
    }

    try {
      setSaving(true);
      Keyboard.dismiss();

      if (subscription && id) {
        await updateSubscription(id, {
          name: name.trim(),
          amount: parseFloat(amount),
          frequency,
          description: description.trim(),
          account_id: accountId,
          next_payment_date: nextPaymentDate.getTime(),
          allow_notifications: allowNotifications ? 1 : 0,
        });

        setShowSuccessAlert(true);
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar la suscripción");
    } finally {
      setSaving(false);
    }
  };

  const formatFrequency = (frequency: SubscriptionFrequency) => {
    switch (frequency) {
      case "daily":
        return "Diaria";
      case "weekly":
        return "Semanal";
      case "monthly":
        return "Mensual";
      case "yearly":
        return "Anual";
      default:
        return frequency;
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account ? account.name : "Seleccionar cuenta";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7952FC" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Suscripción actualizada!"
        message="Los cambios han sido guardados exitosamente"
        confirmText="Aceptar"
        confirmButtonColor="#38C172"
        onConfirm={() => {
          setShowSuccessAlert(false);
          router.back();
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Editar suscripción</Text>
              <Text style={styles.subtitle}>Actualiza los detalles</Text>
            </View>
          </View>

          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Netflix, Spotify, etc."
              placeholderTextColor="#AAA"
            />

            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#AAA"
            />

            <Text style={styles.label}>Frecuencia</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            >
              <Text style={styles.selectText}>
                {formatFrequency(frequency)}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
            </TouchableOpacity>

            {showFrequencyPicker && (
              <View style={styles.optionsContainer}>
                {(
                  [
                    "daily",
                    "weekly",
                    "monthly",
                    "yearly",
                  ] as SubscriptionFrequency[]
                ).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={styles.optionItem}
                    onPress={() => {
                      setFrequency(freq);
                      setShowFrequencyPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        frequency === freq && styles.selectedOptionText,
                      ]}
                    >
                      {formatFrequency(freq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Cuenta</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowAccountPicker(!showAccountPicker)}
            >
              <Text style={styles.selectText}>{getAccountName(accountId)}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
            </TouchableOpacity>

            {showAccountPicker && (
              <View style={styles.optionsContainer}>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={styles.optionItem}
                    onPress={() => {
                      setAccountId(account.id);
                      setShowAccountPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        accountId === account.id && styles.selectedOptionText,
                      ]}
                    >
                      {account.name}
                    </Text>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Próximo pago</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectText}>
                {format(nextPaymentDate, "dd/MM/yyyy")}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#333" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={nextPaymentDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNextPaymentDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detalles adicionales de la suscripción..."
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={3}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Recibir notificaciones</Text>
              <Switch
                value={allowNotifications}
                onValueChange={setAllowNotifications}
                trackColor={{ false: "#DDD", true: "#BCA9FF" }}
                thumbColor={allowNotifications ? "#7952FC" : "#F4F3F4"}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.savingButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
    color: "#333",
  },
  optionsContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#7952FC",
    fontWeight: "500",
  },
  accountBalance: {
    fontSize: 14,
    color: "#666",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#7952FC",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  savingButton: {
    backgroundColor: "#9E85FA",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
