import { Category } from "@/contexts/CategoriesContext";
import { useCategories } from "@/hooks/useCategories";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import BottomSheetBase from "./BottomSheetBase";

interface CategorySheetProps {
  onSelectCategory: (category: Category, type: "expense" | "income") => void;
  onClose?: () => void;
  visible: boolean;
}

export default function CategorySheet({
  onSelectCategory,
  onClose,
  visible,
}: CategorySheetProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const { expenseCategories, incomeCategories, loading } = useCategories();

  // Usar las categorías adecuadas según el tab activo
  const filteredCategories =
    activeTab === "expense" ? expenseCategories : incomeCategories;

  // Valor animado para la opacidad durante la transición
  const contentOpacity = useSharedValue(1);

  // Efecto para animar la transición entre tabs
  useEffect(() => {
    // Cancelar animación anterior
    cancelAnimation(contentOpacity);

    // Animación optimizada con spring para mejor feel
    contentOpacity.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.out(Easing.quad),
      },
      () => {
        "worklet";
        contentOpacity.value = withSpring(1, {
          damping: 15,
          mass: 0.8,
          overshootClamping: false
        });
      }
    );
  }, [activeTab, contentOpacity]);

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    onSelectCategory(category, activeTab);
  };

  // Estilo animado para la transición de contenido
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        {
          scale: contentOpacity.value * 0.05 + 0.95, // Sutil efecto de escala
        },
        {
          translateY: (1 - contentOpacity.value) * 10, // Sutil movimiento vertical
        },
      ],
    };
  });

  return (
    <BottomSheetBase
      title="Selecciona una categoría"
      visible={visible}
      onClose={onClose}
    >
        {/* Transaction type tabs */}
        <View className="flex flex-row mb-5 bg-[#15152b] rounded-xl p-1">
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${activeTab === "expense" ? "bg-primary" : "bg-transparent"}`}
          onPress={() => setActiveTab("expense")}
        >
          <Text
            className={`text-center ${activeTab === "expense" ? "text-white font-bold" : "text-gray-400"}`}
          >
            <Text>▼ </Text>Gasto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${activeTab === "income" ? "bg-primary" : "bg-transparent"}`}
          onPress={() => setActiveTab("income")}
        >
          <Text
            className={`text-center ${activeTab === "income" ? "text-white font-bold" : "text-gray-400"}`}
          >
            <Text>▲ </Text>Ingreso
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories grid */}
      {loading ? (
        <View className="items-center justify-center py-10">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-white mt-2">Cargando categorías...</Text>
        </View>
      ) : (
        <Animated.View style={[animatedContentStyle, { marginBottom: 20 }]}>
          {filteredCategories.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-white text-center">
                No hay categorías disponibles.
              </Text>
            </View>
          ) : (
            <Animated.ScrollView
              style={{ height: 300 }} // Altura fija para el ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View className="flex-row flex-wrap justify-between">
                {filteredCategories.map((category, index) => (
                  <Animated.View
                    entering={FadeInUp.delay(index * 50).duration(200)}
                    key={category.id}
                    className="w-[33%] p-2"
                  >
                    <TouchableOpacity
                      className={`flex-col w-full p-3 rounded-xl items-center justify-center ${selectedCategory?.id === category.id ? "bg-primary" : "bg-[#2d2d3a]"}`}
                      onPress={() => handleSelectCategory(category)}
                    >
                      <Text className="text-3xl mb-1">{category.icon}</Text>
                      <Text className="text-white text-center text-sm">
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.ScrollView>
          )}
        </Animated.View>
      )}
    </BottomSheetBase>
  );
}
