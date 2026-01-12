import { useCategories } from "@/contexts/CategoriesContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_ICONS = [
  "🍔", "🍕", "🍜", "☕", "🍰", "🍱", "🚗", "🚕", "🚌", "✈️",
  "🏠", "🏥", "🎓", "💼", "👕", "👞", "💄", "📱", "💻", "🎮",
  "🎵", "📚", "⚽", "🎾", "🏋️", "💪", "🧘", "🛏️", "🧳", "💍",
  "💐", "🎁", "🎂", "🎉", "✂️", "🧹", "🧽", "🧴", "🧼", "💊",
  "🏦", "💳", "💰", "💸", "📊", "📈", "🔧", "🔨", "⚡", "🔌",
  "🌍", "✈️", "🏖️", "🎬", "🎤", "🏆", "🎯", "🔐", "🎨", "📖",
];

const CATEGORY_COLORS = [
  "#FF6B6B", "#FF8E72", "#FFA07A", "#FFB84D", "#FFD93D",
  "#6BCB77", "#4D96FF", "#6A5ACD", "#FF1493", "#00CED1",
  "#FFD700", "#FF8C00", "#20B2AA", "#DC143C", "#9932CC",
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, loading, createCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<"expense" | "income">("expense");

  // Form state
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const expenseCategories = categories.filter(c => c.type === "expense");
  const incomeCategories = categories.filter(c => c.type === "income");
  const filteredCategories = selectedType === "expense" ? expenseCategories : incomeCategories;

  const handleCreateCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la categoría");
      return;
    }

    try {
      setIsCreating(true);
      await createCategory({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
      });

      // Reset form
      setName("");
      setSelectedIcon(CATEGORY_ICONS[0]);
      setSelectedColor(CATEGORY_COLORS[0]);
      setShowForm(false);

      Alert.alert("Éxito", "Categoría creada correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la categoría");
    } finally {
      setIsCreating(false);
    }
  };

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
          onPress={() => setShowForm(true)}
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

      {/* Add Category Form */}
      {showForm && (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>Nueva categoría</Text>

            {/* Nombre */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder={`Ej: ${selectedType === "income" ? "Freelance" : "Supermercado"}`}
                value={name}
                onChangeText={setName}
                editable={!isCreating}
                placeholderTextColor="#999"
              />
            </View>

            {/* Icono */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Icono</Text>
              <View style={styles.selectedIconContainer}>
                <Text style={styles.selectedIcon}>{selectedIcon}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconScroll}
                contentContainerStyle={styles.iconScrollContent}
              >
                {CATEGORY_ICONS.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon && styles.selectedIconButton,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    disabled={isCreating}
                  >
                    <Text style={styles.iconButtonText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorButton,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    disabled={isCreating}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowForm(false)}
                disabled={isCreating}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.createButton,
                  (!name.trim() || isCreating) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateCategory}
                disabled={!name.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Crear Categoría</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
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
  formContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    maxHeight: "80%",
  },
  formContent: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  selectedIconContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedIcon: {
    fontSize: 48,
  },
  iconScroll: {
    maxHeight: 70,
  },
  iconScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedIconButton: {
    borderColor: "#7952FC",
    backgroundColor: "rgba(121, 82, 252, 0.1)",
  },
  iconButtonText: {
    fontSize: 32,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorButton: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColorButton: {
    borderColor: "#333",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#7952FC",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
