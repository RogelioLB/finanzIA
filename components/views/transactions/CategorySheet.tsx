import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import BottomSheetBase from "./BottomSheetBase";

// Define Category type
export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  type: "expense" | "income";
}

// Mock data for categories
const EXPENSE_CATEGORIES: Category[] = [
  { id: "1", name: "Comida", icon: "🍔", color: "#FF6B6B", type: "expense" },
  {
    id: "2",
    name: "Transporte",
    icon: "🚗",
    color: "#4ECDC4",
    type: "expense",
  },
  {
    id: "3",
    name: "Hobby",
    icon: "🎬",
    color: "#FFD166",
    type: "expense",
  },
  { id: "4", name: "Compras", icon: "🛍️", color: "#F9C80E", type: "expense" },
  { id: "5", name: "Servicios", icon: "💡", color: "#FF9F1C", type: "expense" },
  { id: "6", name: "Salud", icon: "💊", color: "#FF6B6B", type: "expense" },
  { id: "7", name: "Casa", icon: "🏠", color: "#4ECDC4", type: "expense" },
  { id: "8", name: "Educación", icon: "📚", color: "#F9C80E", type: "expense" },
  { id: "9", name: "Otro", icon: "💭", color: "#FF9F1C", type: "expense" },
];

const INCOME_CATEGORIES: Category[] = [
  { id: "10", name: "Salario", icon: "💰", color: "#4ECDC4", type: "income" },
  { id: "11", name: "Freelance", icon: "💻", color: "#FFD166", type: "income" },
  { id: "12", name: "Regalos", icon: "🎁", color: "#FF6B6B", type: "income" },
  { id: "13", name: "Inversión", icon: "📈", color: "#F9C80E", type: "income" },
  { id: "14", name: "Reembolso", icon: "💸", color: "#FF9F1C", type: "income" },
  { id: "15", name: "Otro", icon: "💭", color: "#4ECDC4", type: "income" },
];

const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

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

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    onSelectCategory(category, activeTab);
  };

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
      <Animated.ScrollView className="mb-5 max-h-96">
        <View className="flex-row flex-wrap justify-between">
          {CATEGORIES.filter((category) => category.type === activeTab).map(
            (category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInUp.delay(index * 50)
                  .springify()
                  .damping(12)
                  .stiffness(100)}
                className="w-[33%] p-3 rounded-xl items-center justify-center"
              >
                <TouchableOpacity
                  className={`flex-col w-full p-3 rounded-xl items-center justify-center ${selectedCategory?.id === category.id ? "bg-primary" : "bg-[#2d2d3a]"}`}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text className="text-3xl mb-1">{category.icon}</Text>
                  <Text className="text-white text-center">
                    {category.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )
          )}
        </View>
      </Animated.ScrollView>
    </BottomSheetBase>
  );
}
