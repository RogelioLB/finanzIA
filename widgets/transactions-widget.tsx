import { useTransactions } from "@/hooks/useTransactions";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInLeft } from "react-native-reanimated";

export default function TransactionsWidget() {
  const { recentTransactions, loading, formatAmount, formatDate } =
    useTransactions();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#7952FC" />
        <Text style={styles.loadingText}>Cargando transacciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transacciones Recientes</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push("/history" as any)}
        >
          <Text style={styles.viewAllText}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={16} color="#7952FC" />
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.emptyState}
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={32} color="#999" />
          </View>
          <Text style={styles.emptyTitle}>No hay transacciones</Text>
          <Text style={styles.emptySubtitle}>
            Tus transacciones aparecerán aquí
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/add-transaction" as any)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Agregar transacción</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentTransactions.map((transaction, index) => (
            <Animated.View
              key={transaction.id}
              entering={SlideInLeft.delay(index * 100).duration(600)}
            >
              <TouchableOpacity
                style={styles.transactionItem}
                onPress={() =>
                  router.push(`/edit-transaction/${transaction.id}` as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          transaction.is_excluded === 1
                            ? "#E5E7EB"
                            : transaction.category_color || "#F0F0F0",
                      },
                    ]}
                  >
                    {transaction.category_icon ? (
                      <Text style={[
                        styles.categoryIconText,
                        transaction.is_excluded === 1 && styles.excludedText
                      ]}>
                        {transaction.category_icon}
                      </Text>
                    ) : (
                      <Ionicons
                        name={transaction.type === "expense" ? "remove" : "add"}
                        size={16}
                        color={transaction.is_excluded === 1 ? "#9CA3AF" : "#666"}
                      />
                    )}
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text style={[
                      styles.transactionTitle,
                      transaction.is_excluded === 1 && styles.excludedText
                    ]} numberOfLines={1}>
                      {transaction.title}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={[
                        styles.categoryName,
                        transaction.is_excluded === 1 && styles.excludedText
                      ]}>
                        {transaction.category_name || "Sin categoría"}
                      </Text>
                      <Text style={[
                        styles.separator,
                        transaction.is_excluded === 1 && styles.excludedText
                      ]}>•</Text>
                      <Text style={[
                        styles.walletName,
                        transaction.is_excluded === 1 && styles.excludedText
                      ]}>
                        {transaction.wallet_name || "Wallet"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.is_excluded === 1
                        ? styles.excludedAmount
                        : {
                            color:
                              transaction.type === "expense"
                                ? "#FF4757"
                                : "#2ED573",
                          },
                    ]}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </Text>
                  <Text style={[
                    styles.transactionDate,
                    transaction.is_excluded === 1 && styles.excludedText
                  ]}>
                    {formatDate(transaction.timestamp)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}

          <TouchableOpacity
            style={styles.addTransactionButton}
            onPress={() => router.push("/add-transaction" as any)}
          >
            <Ionicons name="add" size={20} color="#7952FC" />
            <Text style={styles.addTransactionText}>Agregar transacción</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7952FC",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7952FC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 12,
    color: "#666",
  },
  separator: {
    fontSize: 12,
    color: "#CCC",
    marginHorizontal: 6,
  },
  walletName: {
    fontSize: 12,
    color: "#666",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  addTransactionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E8E0FF",
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 6,
  },
  addTransactionText: {
    fontSize: 14,
    color: "#7952FC",
    fontWeight: "600",
    marginLeft: 6,
  },
  excludedText: {
    color: "#9CA3AF",
  },
  excludedAmount: {
    color: "#9CA3AF",
  },
});
