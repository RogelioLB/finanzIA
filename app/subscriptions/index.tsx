import AnimatedAlert from "@/components/AnimatedAlert";
import { useSubscriptions } from "@/contexts/SubscriptionsContext";
import { useAccounts } from "@/hooks/useAccounts";
import { Subscription, SubscriptionFrequency } from "@/lib/models/types";
import { formatCurrency } from "@/lib/utils";
import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscriptions, loadingSubscriptions, removeSubscription } =
    useSubscriptions();
  const { accounts } = useAccounts();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleDelete = useCallback((subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteAlert(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (selectedSubscription) {
      try {
        await removeSubscription(selectedSubscription.id);
        setShowDeleteAlert(false);
        setSuccessMessage(
          `La suscripción "${selectedSubscription.name}" ha sido eliminada`
        );
        setShowSuccessAlert(true);
      } catch (error) {
        Alert.alert("Error", "No se pudo eliminar la suscripción");
      }
    }
  }, [selectedSubscription, removeSubscription]);

  const getAccountName = useCallback(
    (accountId: string) => {
      const account = accounts.find((acc) => acc.id === accountId);
      return account ? account.name : "Cuenta desconocida";
    },
    [accounts]
  );

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

  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/accounts/subscription/edit",
            params: { id: item.id },
          })
        }
      >
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <MaterialIcons name="delete-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <View style={styles.subscriptionDetails}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.frequency}>
            {formatFrequency(item.frequency)}
          </Text>
        </View>
        <View style={styles.subscriptionFooter}>
          <Text style={styles.account}>
            Cuenta: {getAccountName(item.account_id)}
          </Text>
          <Text style={styles.nextPayment}>
            Próximo pago:{" "}
            {format(new Date(item.next_payment_date), "dd/MM/yyyy")}
          </Text>
        </View>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <View style={styles.notificationStatus}>
          <MaterialIcons
            name={
              item.allow_notifications
                ? "notifications-active"
                : "notifications-off"
            }
            size={16}
            color={item.allow_notifications ? "#38C172" : "#888"}
          />
          <Text
            style={{
              color: item.allow_notifications ? "#38C172" : "#888",
              marginLeft: 4,
              fontSize: 12,
            }}
          >
            {item.allow_notifications
              ? "Notificaciones activadas"
              : "Notificaciones desactivadas"}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [getAccountName, handleDelete, router]
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="subscriptions" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No tienes suscripciones</Text>
      <Text style={styles.emptyStateDescription}>
        Añade una nueva suscripción para mantener un seguimiento de tus pagos
        recurrentes
      </Text>
    </View>
  );

  return (
    <>
      <AnimatedAlert
        visible={showDeleteAlert}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar la suscripción "${selectedSubscription?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonColor="#FF6B6B"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteAlert(false)}
      />

      <AnimatedAlert
        visible={showSuccessAlert}
        title="Operación exitosa"
        message={successMessage}
        confirmText="Aceptar"
        confirmButtonColor="#38C172"
        onConfirm={() => setShowSuccessAlert(false)}
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
            <Text style={styles.title}>Suscripciones</Text>
            <Text style={styles.subtitle}>Gestiona tus pagos recurrentes</Text>
          </View>
        </View>

        {loadingSubscriptions ? (
          <ActivityIndicator
            size="large"
            color="#7952FC"
            style={styles.loader}
          />
        ) : (
          <>
            <FlatList
              data={subscriptions}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/subscriptions/add")}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
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
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  subscriptionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7952FC",
  },
  frequency: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#F0F0F0",
    padding: 6,
    borderRadius: 8,
  },
  subscriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  account: {
    fontSize: 14,
    color: "#555",
  },
  nextPayment: {
    fontSize: 14,
    color: "#555",
  },
  description: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
    marginBottom: 8,
  },
  notificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  loader: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#555",
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7952FC",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
