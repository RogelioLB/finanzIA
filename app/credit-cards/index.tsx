import CreditCard from "@/components/CreditCard";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreditCardsScreen() {
  const router = useRouter();
  const { defaultCurrency } = useUser();
  const {
    creditCards,
    isLoading,
    totalCreditLimit,
    totalBalance,
    totalAvailableCredit,
  } = useCreditCards();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: defaultCurrency,
    }).format(amount);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return "#FF6B6B";
    if (percentage >= 50) return "#FFA500";
    return "#4CAF50";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarjetas de Crédito</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/credit-cards/add")}
        >
          <Ionicons name="add" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen Total</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Límite total</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalCreditLimit)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo actual</Text>
              <Text style={[styles.summaryValue, { color: "#FF6B6B" }]}>
                {formatCurrency(totalBalance)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Disponible</Text>
              <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
                {formatCurrency(totalAvailableCredit)}
              </Text>
            </View>
          </View>
          {totalCreditLimit > 0 && (
            <View style={styles.utilizationContainer}>
              <View style={styles.utilizationBar}>
                <View
                  style={[
                    styles.utilizationFill,
                    {
                      width: `${Math.min(100, (totalBalance / totalCreditLimit) * 100)}%`,
                      backgroundColor: getUtilizationColor(
                        (totalBalance / totalCreditLimit) * 100
                      ),
                    },
                  ]}
                />
              </View>
              <Text style={styles.utilizationText}>
                {((totalBalance / totalCreditLimit) * 100).toFixed(0)}% utilizado
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Lista de tarjetas */}
        {creditCards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Sin tarjetas de crédito</Text>
            <Text style={styles.emptyText}>
              Agrega tus tarjetas para llevar control de tus límites y fechas de pago
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/credit-cards/add")}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Agregar tarjeta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          creditCards.map((card, index) => (
            <Animated.View
              key={card.id}
              entering={FadeInDown.delay(200 + index * 100)}
            >
              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => router.push(`/credit-cards/edit/${card.id}`)}
              >
                <CreditCard
                  name={card.name}
                  bank={card.bank || undefined}
                  lastFourDigits={card.last_four_digits || undefined}
                  color={card.color || undefined}
                />
                
                <View style={styles.cardDetails}>
                  <View style={styles.cardBalanceRow}>
                    <View>
                      <Text style={styles.cardBalanceLabel}>Saldo actual</Text>
                      <Text style={styles.cardBalanceValue}>
                        {formatCurrency(card.current_balance)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.cardBalanceLabel}>Disponible</Text>
                      <Text style={[styles.cardBalanceValue, { color: "#4CAF50" }]}>
                        {formatCurrency(card.available_credit || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Barra de utilización */}
                  <View style={styles.cardUtilization}>
                    <View style={styles.utilizationBar}>
                      <View
                        style={[
                          styles.utilizationFill,
                          {
                            width: `${card.utilization_percentage || 0}%`,
                            backgroundColor: getUtilizationColor(
                              card.utilization_percentage || 0
                            ),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.cardUtilizationText}>
                      {(card.utilization_percentage || 0).toFixed(0)}% de{" "}
                      {formatCurrency(card.credit_limit)}
                    </Text>
                  </View>

                  {/* Fechas */}
                  <View style={styles.cardDates}>
                    <View style={styles.dateItem}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.dateLabel}>Corte:</Text>
                      <Text style={styles.dateValue}>
                        {card.next_cut_off_date
                          ? formatDate(card.next_cut_off_date)
                          : `Día ${card.cut_off_day}`}
                      </Text>
                    </View>
                    <View style={styles.dateItem}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.dateLabel}>Pago:</Text>
                      <Text
                        style={[
                          styles.dateValue,
                          (card.days_until_payment || 0) <= 5 && { color: "#FF6B6B" },
                        ]}
                      >
                        {card.next_payment_date
                          ? formatDate(card.next_payment_date)
                          : `Día ${card.payment_due_day}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {creditCards.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/credit-cards/add")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  utilizationContainer: {
    marginTop: 16,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  utilizationFill: {
    height: "100%",
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
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
    gap: 8,
    backgroundColor: "#7952FC",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cardWrapper: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDetails: {
    padding: 16,
    paddingTop: 12,
  },
  cardBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardBalanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  cardBalanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  cardUtilization: {
    marginBottom: 16,
  },
  cardUtilizationText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  cardDates: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7952FC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7952FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
