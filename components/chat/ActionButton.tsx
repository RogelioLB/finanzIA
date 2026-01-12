import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Toast from "toastify-react-native";
import { useObjectives } from "@/contexts/ObjectivesContext";

interface ActionButtonProps {
  type: "save_objective" | "create_budget";
  data: any;
  label?: string;
}

export default function ActionButton({
  type,
  data,
  label,
}: ActionButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createObjective } = useObjectives();

  const handleSaveObjective = async () => {
    if (isSaved) return;

    setIsLoading(true);
    try {
      const { title, amount, type: objectiveType, dueDate, monthlyPayment } = data;

      if (!title || !amount) {
        Toast.warn("Faltan datos para guardar el objetivo");
        return;
      }

      await createObjective({
        title,
        amount,
        current_amount: 0,
        type: objectiveType || "savings",
        due_date: dueDate || null,
      });

      setIsSaved(true);
      Toast.info("¡Objetivo guardado exitosamente!");
    } catch (error) {
      console.error("[ActionButton] Error saving objective:", error);
      Toast.warn("Error al guardar el objetivo");
    } finally {
      setIsLoading(false);
    }
  };

  if (type === "save_objective") {
    if (isSaved) {
      return (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.savedText}>Guardado como objetivo</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleSaveObjective}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color="#7952FC" />
            <Text style={styles.actionButtonText}>Guardando...</Text>
          </>
        ) : (
          <>
            <Ionicons name="bookmark-outline" size={16} color="#7952FC" />
            <Text style={styles.actionButtonText}>
              {label || "Guardar como objetivo"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F3F0FF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7952FC",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  savedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
});
