import { useCategories } from "@/contexts/CategoriesContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheetBase from "./BottomSheetBase";

interface AddCategorySheetProps {
  visible: boolean;
  onClose: () => void;
  type: "expense" | "income";
  onCategoryCreated?: (categoryId: string) => void;
}

const CATEGORY_ICONS = [
  "🍔", "🍕", "🍜", "☕", "🍰", "🍱", "🚗", "🚕", "🚌", "✈️",
  "🏠", "🏥", "🎓", "💼", "👕", "👞", "💄", "📱", "💻", "🎮",
  "🎵", "📚", "⚽", "🎾", "🏋️", "💪", "🧘", "🛏️", "🧳", "💍",
  "💐", "🎁", "🎂", "🎉", "✂️", "🧹", "🧽", "🧴", "🧼", "💊",
  "🏦", "💳", "💰", "💸", "📊", "📈", "🔧", "🔨", "⚡", "🔌",
];

const CATEGORY_COLORS = [
  "#FF6B6B", "#FF8E72", "#FFA07A", "#FFB84D", "#FFD93D",
  "#6BCB77", "#4D96FF", "#6A5ACD", "#FF1493", "#00CED1",
  "#FFD700", "#FF8C00", "#20B2AA", "#DC143C", "#9932CC",
];

export default function AddCategorySheet({
  visible,
  onClose,
  type,
  onCategoryCreated,
}: AddCategorySheetProps) {
  const { createCategory } = useCategories();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      const categoryId = await createCategory({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type,
      });

      // Reset form
      setName("");
      setSelectedIcon(CATEGORY_ICONS[0]);
      setSelectedColor(CATEGORY_COLORS[0]);

      onCategoryCreated?.(categoryId);
      onClose();
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <BottomSheetBase
      title={`Nueva ${type === "income" ? "entrada" : "categoría de gasto"}`}
      visible={visible}
      onClose={onClose}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder={`Ej: ${type === "income" ? "Freelance" : "Supermercado"}`}
            value={name}
            onChangeText={setName}
            editable={!isCreating}
            placeholderTextColor="#999"
          />
        </View>

        {/* Icono */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icono</Text>
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
          <Text style={styles.sectionTitle}>Color</Text>
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

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista previa</Text>
          <View
            style={[
              styles.previewCard,
              { backgroundColor: selectedColor },
            ]}
          >
            <View style={styles.previewContent}>
              <Text style={styles.previewIcon}>{selectedIcon}</Text>
              <Text style={styles.previewName}>
                {name || `Nueva ${type === "income" ? "entrada" : "categoría"}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón Crear */}
        <TouchableOpacity
          style={[
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
      </ScrollView>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
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
  previewCard: {
    borderRadius: 12,
    padding: 16,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContent: {
    alignItems: "center",
  },
  previewIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  previewName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#7952FC",
    borderRadius: 8,
    paddingVertical: 12,
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
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
