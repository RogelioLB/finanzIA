import { useTransactions } from "@/contexts/TransactionsContext";
import { useWallets } from "@/contexts/WalletsContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedAlert from "../../components/AnimatedAlert";
import { Transaction, useSQLiteService } from "../../lib/database/sqliteService";

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { getTransactions, createTransaction, updateTransaction } = useSQLiteService();
  const { refreshWallets } = useWallets();
  const { refreshTransactions } = useTransactions();

  const [subscriptions, setSubscriptions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const allTransactions = await getTransactions();
      const subs = allTransactions.filter((t) => t.is_subscription === 1);
      setSubscriptions(subs);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  const handleQuickPay = async (subscription: Transaction) => {
    setProcessingId(subscription.id);

    try {
      // 1. Crear una transacción normal (sin suscripción) para registrar el pago
      await createTransaction({
        wallet_id: subscription.wallet_id,
        amount: subscription.amount,
        type: subscription.type,
        title: subscription.title,
        note: subscription.note || `Pago de suscripción: ${subscription.title}`,
        category_id: subscription.category_id,
        is_subscription: 0, // Transacción normal
        is_excluded: 0, // Incluida en el balance
        timestamp: Date.now(), // Fecha actual del pago
      });

      // 2. Calcular la próxima fecha de pago
      const currentDate = subscription.next_payment_date || Date.now();
      let nextDate = currentDate;
      
      switch (subscription.subscription_frequency) {
        case "weekly":
          nextDate = currentDate + 7 * 24 * 60 * 60 * 1000;
          break;
        case "monthly":
          nextDate = currentDate + 30 * 24 * 60 * 60 * 1000;
          break;
        case "yearly":
          nextDate = currentDate + 365 * 24 * 60 * 60 * 1000;
          break;
      }

      // 3. Actualizar la suscripción existente con la nueva fecha de pago
      await updateTransaction(subscription.id, {
        next_payment_date: nextDate,
        timestamp: nextDate, // Actualizar timestamp para que no aparezca en historial actual
      });

      await refreshWallets();
      await refreshTransactions();
      await loadSubscriptions(); // Recargar lista
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      setErrorMessage("No se pudo procesar el pago");
      setShowErrorAlert(true);
    } finally {
      setProcessingId(null);
    }
  };

  const getFrequencyText = (frequency?: string) => {
    switch (frequency) {
      case "weekly":
        return "Semanal";
      case "monthly":
        return "Mensual";
      case "yearly":
        return "Anual";
      default:
        return "Mensual";
    }
  };

  const getTimeRemaining = (nextPaymentDate?: number) => {
    if (!nextPaymentDate) return "Fecha no definida";
    
    const now = Date.now();
    const diff = nextPaymentDate - now;
    
    if (diff < 0) return "Vencido";
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `En ${days} ${days === 1 ? "día" : "días"}`;
    } else if (hours > 0) {
      return `En ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else {
      return "Hoy";
    }
  };

  const renderSubscription = ({ item }: { item: Transaction }) => {
    const isProcessing = processingId === item.id;

    return (
      <TouchableOpacity
        style={styles.subscriptionCard}
        onPress={() => router.push(`/subscriptions/edit/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionInfo}>
            {item.category_icon && (
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: item.category_color || "#7952FC" },
                ]}
              >
                <Text style={styles.categoryIconText}>{item.category_icon}</Text>
              </View>
            )}
            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionTitle}>{item.title}</Text>
              <View style={styles.subscriptionMeta}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.subscriptionFrequency}>
                  {getFrequencyText(item.subscription_frequency)}
                </Text>
                {item.wallet_name && (
                  <>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.walletName}>{item.wallet_name}</Text>
                  </>
                )}
              </View>
              <View style={styles.timeRemainingContainer}>
                <Ionicons name="time-outline" size={14} color="#7952FC" />
                <Text style={styles.timeRemainingText}>
                  {getTimeRemaining(item.next_payment_date)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.subscriptionRight}>
            <Text
              style={[
                styles.subscriptionAmount,
                { color: item.type === "income" ? "#4CAF50" : "#FF6B6B" },
              ]}
            >
              {item.type === "income" ? "+" : "-"}${item.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Quick Pay Button */}
        <TouchableOpacity
          style={[
            styles.quickPayButton,
            isProcessing && styles.quickPayButtonDisabled,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleQuickPay(item);
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <Text style={styles.quickPayButtonText}>Pago Rápido</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suscripciones</Text>
        <TouchableOpacity
          onPress={() => router.push("/subscriptions/add" as any)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7952FC" />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No hay suscripciones</Text>
          <Text style={styles.emptyText}>
            Agrega tus suscripciones recurrentes para llevar un mejor control
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/subscriptions/add" as any)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Agregar Suscripción</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderSubscription}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Alerts */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Pago registrado!"
        message="El pago de la suscripción se ha registrado correctamente"
        confirmText="OK"
        confirmButtonColor="#4CAF50"
        onConfirm={() => setShowSuccessAlert(false)}
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7952FC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  subscriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subscriptionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconText: {
    fontSize: 20,
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  subscriptionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subscriptionFrequency: {
    fontSize: 13,
    color: "#6B7280",
  },
  metaSeparator: {
    fontSize: 13,
    color: "#D1D5DB",
    marginHorizontal: 4,
  },
  walletName: {
    fontSize: 13,
    color: "#6B7280",
  },
  subscriptionRight: {
    alignItems: "flex-end",
  },
  subscriptionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  quickPayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7952FC",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  quickPayButtonDisabled: {
    opacity: 0.6,
  },
  quickPayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timeRemainingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  timeRemainingText: {
    fontSize: 12,
    color: "#7952FC",
    fontWeight: "600",
  },
});
