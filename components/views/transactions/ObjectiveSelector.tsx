import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import { useObjectives } from "@/hooks/useObjectives";
import tw from "twrnc";

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
      style={tw`flex-1`}
      contentContainerStyle={tw`gap-2`}
    >
      {/* Opción: Sin vincular objetivo */}
      <TouchableOpacity
        onPress={() => onSelect(undefined)}
        style={[
          tw`px-4 py-3 rounded-lg border-2`,
          !selectedObjectiveId
            ? tw`bg-purple-100 border-purple-500`
            : tw`bg-gray-100 border-gray-300`,
        ]}
      >
        <Text
          style={[
            tw`text-sm font-semibold`,
            !selectedObjectiveId ? tw`text-purple-700` : tw`text-gray-600`,
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
              tw`px-4 py-3 rounded-lg border-2`,
              isSelected
                ? tw`bg-purple-100 border-purple-500`
                : tw`bg-gray-100 border-gray-300`,
            ]}
          >
            <Text
              style={[
                tw`text-sm font-semibold`,
                isSelected ? tw`text-purple-700` : tw`text-gray-700`,
              ]}
              numberOfLines={1}
            >
              {objective.title}
            </Text>
            <Text
              style={[
                tw`text-xs mt-1`,
                isSelected ? tw`text-purple-600` : tw`text-gray-500`,
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
