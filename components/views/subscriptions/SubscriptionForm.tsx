import { Category } from "@/contexts/CategoriesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { useCategories } from "@/hooks/useCategories";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Transaction, useSQLiteService } from "../../../lib/database/sqliteService";
import AnimatedAlert from "../../AnimatedAlert";
import AmountBottomSheet from "../wallets/AmountBottomSheet";

type FrequencyType = "weekly" | "monthly" | "yearly";
type RecurrenceType = "forever" | "times";

interface SubscriptionFormProps {
  mode: "add" | "edit";
  subscriptionId?: string;
}

export default function SubscriptionForm({
  mode,
  subscriptionId,
}: SubscriptionFormProps) {
  const router = useRouter();
  const { wallets, refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();
  const { expenseCategories, incomeCategories } = useCategories();
  const {
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useSQLiteService();

  const [subscription, setSubscription] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");

  const [type, setType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [frequency, setFrequency] = useState<FrequencyType>("monthly");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    "forever"
  );
  const [recurrenceTimes, setRecurrenceTimes] = useState(1);
  const [nextPaymentDate, setNextPaymentDate] = useState(Date.now());

  const [showAmountSheet, setShowAmountSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showWalletSheet, setShowWalletSheet] = useState(false);
  const [showFrequencySheet, setShowFrequencySheet] = useState(false);
  const [showRecurrenceSheet, setShowRecurrenceSheet] = useState(false);
  const [showTimesSheet, setShowTimesSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const frequencyLabels = {
    weekly: "Semana",
    monthly: "Mes",
    yearly: "Año",
  };

  useEffect(() => {
    if (mode === "edit" && subscriptionId) {
      loadSubscription();
    }
  }, [mode, subscriptionId]);

  const loadSubscription = async () => {
    if (!subscriptionId) return;

    setIsLoading(true);
    try {
      const sub = await getTransactionById(subscriptionId);
      if (!sub || sub.is_subscription !== 1) {
        setErrorMessage("Suscripción no encontrada");
        setShowErrorAlert(true);
        return;
      }

      setSubscription(sub);
      setType(sub.type as "expense" | "income");
      setTitle(sub.title);
      setAmount(sub.amount.toString());
      setSelectedWallet(sub.wallet_id);
      setFrequency((sub.subscription_frequency as FrequencyType) || "monthly");

      // Cargar categoría
      const allCategories = [...expenseCategories, ...incomeCategories];
      const category = allCategories.find((c) => c.id === sub.category_id);
      if (category) {
        setSelectedCategory(category);
      }

      // Determinar recurrencia
      if (sub.end_date) {
        setRecurrenceType("times");
        const now = Date.now();
        const diff = sub.end_date - now;
        const freq = sub.subscription_frequency || "monthly";
        const divisor =
          freq === "weekly"
            ? 7 * 24 * 60 * 60 * 1000
            : freq === "monthly"
            ? 30 * 24 * 60 * 60 * 1000
            : 365 * 24 * 60 * 60 * 1000;
        const times = Math.max(1, Math.ceil(diff / divisor));
        setRecurrenceTimes(times);
      } else {
        setRecurrenceType("forever");
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      setErrorMessage("Error al cargar la suscripción");
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecurrenceText = () => {
    if (recurrenceType === "forever") {
      return "Para siempre";
    }
    return `${recurrenceTimes} ${recurrenceTimes === 1 ? "vez" : "veces"}`;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage("Por favor ingresa un título");
      setShowErrorAlert(true);
      return;
    }

    if (!selectedCategory) {
      setErrorMessage("Por favor selecciona una categoría");
      setShowErrorAlert(true);
      return;
    }

    if (!selectedWallet) {
      setErrorMessage("Por favor selecciona una cuenta");
      setShowErrorAlert(true);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Por favor ingresa un monto válido");
      setShowErrorAlert(true);
      return;
    }

    setIsProcessing(true);

    try {
      let endDate: number | undefined;
      if (recurrenceType === "times") {
        const now = Date.now();
        const millisecondsToAdd =
          frequency === "weekly"
            ? recurrenceTimes * 7 * 24 * 60 * 60 * 1000
            : frequency === "monthly"
            ? recurrenceTimes * 30 * 24 * 60 * 60 * 1000
            : recurrenceTimes * 365 * 24 * 60 * 60 * 1000;
        endDate = now + millisecondsToAdd;
      }

      const transactionData = {
        wallet_id: selectedWallet,
        amount: amountNum,
        type,
        title: title.trim(),
        category_id: selectedCategory.id,
        is_subscription: 1,
        subscription_frequency: frequency,
        next_payment_date: nextPaymentDate,
        end_date: endDate,
        is_excluded: 1, // Excluir hasta que se pague
        timestamp: nextPaymentDate, // Usar fecha de próximo pago como timestamp
      };

      if (mode === "add") {
        await createTransaction(transactionData);
      } else if (subscription) {
        await updateTransaction(subscription.id, transactionData);
      }

      await refreshWallets();
      await refreshTransactions();
      setShowSuccessAlert(true);
    } catch (error) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} subscription:`, error);
      setErrorMessage(
        `No se pudo ${mode === "add" ? "crear" : "actualizar"} la suscripción`
      );
      setShowErrorAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!subscription) return;

    setIsProcessing(true);
    try {
      await deleteTransaction(subscription.id);
      await refreshWallets();
      router.back();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      setErrorMessage("No se pudo eliminar la suscripción");
      setShowErrorAlert(true);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const selectedWalletObj = wallets.find((w) => w.id === selectedWallet);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "add" ? "Nueva Suscripción" : "Editar Suscripción"}
        </Text>
        {mode === "edit" ? (
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && styles.typeButtonActive,
            ]}
            onPress={() => {
              setType("expense");
              setSelectedCategory(null);
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === "expense" && styles.typeButtonTextActive,
              ]}
            >
              Gasto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && styles.typeButtonActive,
            ]}
            onPress={() => {
              setType("income");
              setSelectedCategory(null);
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === "income" && styles.typeButtonTextActive,
              ]}
            >
              Ingreso
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Título</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="text-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Ej: Netflix, Spotify, Renta..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Monto</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowAmountSheet(true)}
          >
            <Ionicons name="cash-outline" size={20} color="#9CA3AF" />
            <Text
              style={
                amount === "0" ? styles.selectorPlaceholder : styles.selectorText
              }
            >
              {amount === "0" ? "Seleccionar monto" : `$${amount}`}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCategorySheet(true)}
          >
            {selectedCategory ? (
              <>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: selectedCategory.color },
                  ]}
                >
                  <Text style={styles.categoryIconText}>
                    {selectedCategory.icon}
                  </Text>
                </View>
                <Text style={styles.selectorText}>{selectedCategory.name}</Text>
              </>
            ) : (
              <>
                <Ionicons name="grid-outline" size={20} color="#9CA3AF" />
                <Text style={styles.selectorPlaceholder}>
                  Seleccionar categoría
                </Text>
              </>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Wallet */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cuenta</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowWalletSheet(true)}
          >
            {selectedWalletObj ? (
              <>
                <View
                  style={[
                    styles.walletIcon,
                    { backgroundColor: selectedWalletObj.color },
                  ]}
                >
                  <Text style={styles.walletIconText}>
                    {selectedWalletObj.icon}
                  </Text>
                </View>
                <Text style={styles.selectorText}>{selectedWalletObj.name}</Text>
              </>
            ) : (
              <>
                <Ionicons name="wallet-outline" size={20} color="#9CA3AF" />
                <Text style={styles.selectorPlaceholder}>Seleccionar cuenta</Text>
              </>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Frequency Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Frecuencia</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowFrequencySheet(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            <Text style={styles.selectorText}>
              Cada {frequencyLabels[frequency]}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Recurrence Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Duración</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowRecurrenceSheet(true)}
          >
            <Ionicons name="repeat-outline" size={20} color="#9CA3AF" />
            <Text style={styles.selectorText}>{getRecurrenceText()}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Next Payment Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Próximo Pago</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            <Text style={styles.selectorText}>
              {new Date(nextPaymentDate).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Frequency Description */}
        <View style={styles.frequencyDescription}>
          <Text style={styles.frequencyDescriptionText}>
            ${amount} se pagará cada{" "}
            <Text style={styles.frequencyHighlight}>
              {frequencyLabels[frequency]}
            </Text>
            {", "}
            <Text style={styles.frequencyHighlight}>{getRecurrenceText()}</Text>
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#7952FC"
          />
          <Text style={styles.infoText}>
            {mode === "add"
              ? "Las suscripciones no se cobran automáticamente. Usa el botón de pago rápido cuando realices el pago."
              : "Los cambios se aplicarán a partir del próximo pago. Los pagos anteriores no se verán afectados."}
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isProcessing && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === "add" ? "Crear Suscripción" : "Guardar Cambios"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Amount Sheet */}
      <AmountBottomSheet
        visible={showAmountSheet}
        amount={amount}
        onAmountChange={setAmount}
        onClose={() => setShowAmountSheet(false)}
        onComplete={(newAmount) => {
          setAmount(newAmount);
          setShowAmountSheet(false);
        }}
      />

      {/* Category Sheet */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
            <ScrollView style={{ width: "100%" }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategorySheet(false);
                  }}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Text style={styles.categoryIconText}>{category.icon}</Text>
                  </View>
                  <Text style={styles.categoryItemText}>{category.name}</Text>
                  {selectedCategory?.id === category.id && (
                    <Ionicons name="checkmark" size={24} color="#7952FC" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategorySheet(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wallet Sheet */}
      <Modal
        visible={showWalletSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalletSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Seleccionar Cuenta</Text>
            <ScrollView style={{ width: "100%" }}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedWallet(wallet.id);
                    setShowWalletSheet(false);
                  }}
                >
                  <View
                    style={[
                      styles.walletIcon,
                      { backgroundColor: wallet.color },
                    ]}
                  >
                    <Text style={styles.walletIconText}>{wallet.icon}</Text>
                  </View>
                  <Text style={styles.categoryItemText}>{wallet.name}</Text>
                  {selectedWallet === wallet.id && (
                    <Ionicons name="checkmark" size={24} color="#7952FC" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWalletSheet(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Frequency Sheet */}
      <Modal
        visible={showFrequencySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencySheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Frecuencia</Text>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                setFrequency("weekly");
                setShowFrequencySheet(false);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#7952FC" />
              <Text style={styles.categoryItemText}>Cada Semana</Text>
              {frequency === "weekly" && (
                <Ionicons name="checkmark" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                setFrequency("monthly");
                setShowFrequencySheet(false);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#7952FC" />
              <Text style={styles.categoryItemText}>Cada Mes</Text>
              {frequency === "monthly" && (
                <Ionicons name="checkmark" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                setFrequency("yearly");
                setShowFrequencySheet(false);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#7952FC" />
              <Text style={styles.categoryItemText}>Cada Año</Text>
              {frequency === "yearly" && (
                <Ionicons name="checkmark" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFrequencySheet(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recurrence Sheet */}
      <Modal
        visible={showRecurrenceSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecurrenceSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Duración</Text>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                setRecurrenceType("forever");
                setShowRecurrenceSheet(false);
              }}
            >
              <Ionicons name="infinite-outline" size={24} color="#7952FC" />
              <Text style={styles.categoryItemText}>Para siempre</Text>
              {recurrenceType === "forever" && (
                <Ionicons name="checkmark" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                setRecurrenceType("times");
                setShowRecurrenceSheet(false);
                setShowTimesSheet(true);
              }}
            >
              <Ionicons name="repeat-outline" size={24} color="#7952FC" />
              <Text style={styles.categoryItemText}>
                {recurrenceType === "times"
                  ? `${recurrenceTimes} ${recurrenceTimes === 1 ? "vez" : "veces"}`
                  : "Número de veces"}
              </Text>
              {recurrenceType === "times" && (
                <Ionicons name="checkmark" size={24} color="#7952FC" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRecurrenceSheet(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Times Sheet */}
      <Modal
        visible={showTimesSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimesSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "60%" }]}>
            <Text style={styles.modalTitle}>¿Cuántas veces?</Text>
            <ScrollView style={{ width: "100%" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30, 36].map(
                (num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.categoryItem}
                    onPress={() => {
                      setRecurrenceTimes(num);
                      setShowTimesSheet(false);
                    }}
                  >
                    <Text style={styles.categoryItemText}>
                      {num} {num === 1 ? "vez" : "veces"}
                    </Text>
                    {recurrenceTimes === num && (
                      <Ionicons name="checkmark" size={24} color="#7952FC" />
                    )}
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTimesSheet(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(nextPaymentDate)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (selectedDate) {
              setNextPaymentDate(selectedDate.getTime());
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* Delete Confirmation */}
      {mode === "edit" && (
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
              <Text style={styles.modalTitle}>¿Eliminar suscripción?</Text>
              <Text style={styles.modalText}>
                Esta acción no se puede deshacer. La suscripción será eliminada
                permanentemente.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonDelete}
                  onPress={handleDelete}
                >
                  <Text style={styles.modalButtonDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Alerts */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title={mode === "add" ? "¡Suscripción creada!" : "¡Actualizado!"}
        message={
          mode === "add"
            ? "La suscripción se ha creado correctamente"
            : "La suscripción se ha actualizado correctamente"
        }
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
        message={errorMessage}
        confirmText="OK"
        confirmButtonColor="#FF6B6B"
        onConfirm={() => setShowErrorAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  typeButtonActive: {
    borderColor: "#7952FC",
    backgroundColor: "#F3F0FF",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  typeButtonTextActive: {
    color: "#7952FC",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#9CA3AF",
  },
  frequencyDescription: {
    backgroundColor: "#F3F0FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  frequencyDescriptionText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
  },
  frequencyHighlight: {
    fontWeight: "700",
    color: "#7952FC",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#7952FC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalButtonDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
  },
  modalButtonDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconText: {
    fontSize: 18,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  walletIconText: {
    fontSize: 18,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  modalCloseButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});
