import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useObjectives } from "@/contexts/ObjectivesContext";

interface ObjectiveSelectorProps {
  selectedObjectiveId?: string;
  onSelect: (objectiveId?: string) => void;
  transactionType: "income" | "expense" | "transfer";
}

export default function ObjectiveSelector({
  selectedObjectiveId,
  onSelect,
  transactionType,
}: ObjectiveSelectorProps) {
  const { objectives } = useObjectives();

  // Filtrar objetivos según el tipo de transacción
  const relevantObjectives = useMemo(() => {
    return objectives.filter((obj) => {
      if (transactionType === "income") {
        // Ingresos contribuyen a ahorros (savings)
        return obj.type === "savings" && !obj.is_archived;
      } else if (transactionType === "expense") {
        // Gastos pagan deudas (debt)
        return obj.type === "debt" && !obj.is_archived;
      }
      return false;
    });
  }, [objectives, transactionType]);

  if (relevantObjectives.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Opción: Sin vincular objetivo */}
      <TouchableOpacity
        onPress={() => onSelect(undefined)}
        style={[
          styles.objectiveCard,
          !selectedObjectiveId
            ? styles.objectiveCardSelected
            : styles.objectiveCardUnselected,
        ]}
      >
        <Text
          style={[
            styles.objectiveTitle,
            !selectedObjectiveId
              ? styles.objectiveTitleSelected
              : styles.objectiveTitleUnselected,
          ]}
        >
          Ninguno
        </Text>
      </TouchableOpacity>

      {/* Objetivos disponibles */}
      {relevantObjectives.map((objective) => {
        const progress = (objective.current_amount / objective.amount) * 100;
        const isSelected = selectedObjectiveId === objective.id;

        return (
          <TouchableOpacity
            key={objective.id}
            onPress={() => onSelect(objective.id)}
            style={[
              styles.objectiveCard,
              isSelected
                ? styles.objectiveCardSelected
                : styles.objectiveCardUnselected,
            ]}
          >
            <Text
              style={[
                styles.objectiveTitle,
                isSelected
                  ? styles.objectiveTitleSelected
                  : styles.objectiveTitleUnselected,
              ]}
              numberOfLines={1}
            >
              {objective.title}
            </Text>
            <Text
              style={[
                styles.objectiveProgress,
                isSelected
                  ? styles.objectiveProgressSelected
                  : styles.objectiveProgressUnselected,
              ]}
            >
              {progress.toFixed(0)}% completado
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  objectiveCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 8,
  },
  objectiveCardSelected: {
    backgroundColor: "#f3f0ff",
    borderColor: "#7952FC",
  },
  objectiveCardUnselected: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  objectiveTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  objectiveTitleSelected: {
    color: "#6d28d9",
  },
  objectiveTitleUnselected: {
    color: "#374151",
  },
  objectiveProgress: {
    fontSize: 12,
    marginTop: 4,
  },
  objectiveProgressSelected: {
    color: "#7c3aed",
  },
  objectiveProgressUnselected: {
    color: "#6b7280",
  },
});
