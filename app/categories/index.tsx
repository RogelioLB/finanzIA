import { useCategories } from "@/contexts/CategoriesContext";
import AddCategorySheet from "@/components/views/transactions/AddCategorySheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading } = useCategories();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedType, setSelectedType] = useState<"expense" | "income">("expense");

  const expenseCategories = categories.filter(c => c.type === "expense");
  const incomeCategories = categories.filter(c => c.type === "income");
  const filteredCategories = selectedType === "expense" ? expenseCategories : incomeCategories;

  const renderCategoryItem = ({ item }: { item: any }) => (
    <View style={[styles.categoryCard, { backgroundColor: item.color || "#f0f0f0" }]}>
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Categorías</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddCategory(true)}
        >
          <Ionicons name="add" size={24} color="#7952FC" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedType === "expense" && styles.activeTab,
          ]}
          onPress={() => setSelectedType("expense")}
        >
          <Text
            style={[
              styles.tabText,
              selectedType === "expense" && styles.activeTabText,
            ]}
          >
            ▼ Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedType === "income" && styles.activeTab,
          ]}
          onPress={() => setSelectedType("income")}
        >
          <Text
            style={[
              styles.tabText,
              selectedType === "income" && styles.activeTabText,
            ]}
          >
            ▲ Ingresos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7952FC" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Sin categorías</Text>
            <Text style={styles.emptySubtitle}>
              Crea una nueva categoría para comenzar
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.listRow}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add Category Sheet */}
      <AddCategorySheet
        visible={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        type={selectedType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  addButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#7952FC",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 12,
  },
  listRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
});
