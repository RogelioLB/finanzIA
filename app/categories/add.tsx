import { useCategories } from "@/contexts/CategoriesContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  "🌍", "🏖️", "🎬", "🎤", "🏆", "🎯", "🔐", "🎨", "📖", "🍎",
  "🌳", "🌸", "⭐", "🎪", "🎭", "🎸", "🏃", "🚴", "🏊", "🧗",
];

const CATEGORY_COLORS = [
  "#FF6B6B", "#FF8E72", "#FFA07A", "#FFB84D", "#FFD93D",
  "#6BCB77", "#4D96FF", "#6A5ACD", "#FF1493", "#00CED1",
  "#FFD700", "#FF8C00", "#20B2AA", "#DC143C", "#9932CC",
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: "expense" | "income" }>();
  const { createCategory } = useCategories();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const categoryType = type || "expense";

  const handleCreate = async () => {
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
        type: categoryType as "expense" | "income",
      });

      Alert.alert("Éxito", "Categoría creada correctamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la categoría");
    } finally {
      setIsCreating(false);
    }
  };

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

        <Text style={styles.headerTitle}>Nueva categoría</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder={`Ej: ${categoryType === "income" ? "Freelance" : "Supermercado"}`}
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
          <View style={styles.iconGrid}>
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
          </View>
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
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vista previa</Text>
          <View
            style={[
              styles.previewCard,
              { backgroundColor: selectedColor },
            ]}
          >
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
            <Text style={styles.previewName}>{name || "Nueva categoría"}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
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
            onPress={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>Crear Categoría</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  selectedIconContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedIcon: {
    fontSize: 56,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconButton: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedIconButton: {
    borderColor: "#7952FC",
    backgroundColor: "rgba(121, 82, 252, 0.15)",
  },
  iconButtonText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  colorButton: {
    width: "18.5%",
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColorButton: {
    borderColor: "#333",
    borderWidth: 3,
  },
  previewCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  previewName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
