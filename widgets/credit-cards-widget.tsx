import CreditCard from "@/components/CreditCard";
import { useCreditCards } from "@/contexts/CreditCardsContext";
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CreditCardsWidget() {
  const router = useRouter();
  const { creditCards, totalBalance, totalAvailableCredit, totalCreditLimit } = useCreditCards();
  const { defaultCurrency } = useUser();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: defaultCurrency || "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const utilizationPercentage = totalCreditLimit > 0
    ? (totalBalance / totalCreditLimit) * 100
    : 0;

  const getUtilizationColor = () => {
    if (utilizationPercentage >= 80) return "#FF6B6B";
    if (utilizationPercentage >= 50) return "#FFA500";
    return "#4CAF50";
  };

  if (creditCards.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={() => router.push("/credit-cards/add")}
      >
        <View style={styles.emptyIcon}>
          <Ionicons name="card-outline" size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>Sin tarjetas de crédito</Text>
        <Text style={styles.emptyText}>Agrega una tarjeta para ver tu disponible</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/credit-cards")}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="card" size={20} color="#7952FC" />
          <Text style={styles.title}>Tarjetas de Crédito</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Saldo actual</Text>
          <Text style={[styles.statValue, { color: "#FF6B6B" }]}>
            {formatCurrency(totalBalance)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Disponible</Text>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>
            {formatCurrency(totalAvailableCredit)}
          </Text>
        </View>
      </View>

      <View style={styles.utilizationContainer}>
        <View style={styles.utilizationBar}>
          <View
            style={[
              styles.utilizationFill,
              {
                width: `${Math.min(100, utilizationPercentage)}%`,
                backgroundColor: getUtilizationColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.utilizationText}>
          {utilizationPercentage.toFixed(0)}% de {formatCurrency(totalCreditLimit)}
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsScrollContent}
      >
        {creditCards.map((card) => (
          <CreditCard
            key={card.id}
            name={card.name}
            bank={card.bank || undefined}
            lastFourDigits={card.last_four_digits || undefined}
            color={card.color || undefined}
            style={styles.miniCard}
            isMini
          />
        ))}
        <TouchableOpacity 
          style={styles.addMiniCard}
          onPress={() => router.push("/credit-cards/add")}
        >
          <Ionicons name="add" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  utilizationContainer: {
    marginBottom: 12,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  utilizationFill: {
    height: "100%",
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  cardsScroll: {
    marginHorizontal: -20,
    marginTop: 8,
  },
  cardsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  miniCard: {
    width: 140,
    aspectRatio: 1.586,
    borderRadius: 10,
    elevation: 2,
    shadowRadius: 4,
  },
  addMiniCard: {
    width: 60,
    aspectRatio: 1.586,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
