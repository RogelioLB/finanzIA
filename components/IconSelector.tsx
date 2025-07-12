import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// Common financial and account-related icons
const AVAILABLE_ICONS = [
  { name: "wallet-outline", label: "Wallet" },
  { name: "cash-outline", label: "Cash" },
  { name: "card-outline", label: "Card" },
  { name: "home-outline", label: "Home" },
  { name: "car-outline", label: "Car" },
  { name: "restaurant-outline", label: "Dining" },
  { name: "bag-outline", label: "Shopping" },
  { name: "airplane-outline", label: "Travel" },
  { name: "business-outline", label: "Business" },
  { name: "gift-outline", label: "Gift" },
  { name: "medkit-outline", label: "Health" },
  { name: "school-outline", label: "Education" },
  { name: "fitness-outline", label: "Fitness" },
  { name: "cart-outline", label: "Groceries" },
  { name: "game-controller-outline", label: "Entertainment" },
  { name: "paw-outline", label: "Pets" },
  { name: "calendar-outline", label: "Subscription" },
  { name: "save-outline", label: "Savings" },
  { name: "trending-up-outline", label: "Investment" },
  { name: "people-outline", label: "Family" },
];

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

export default function IconSelector({
  selectedIcon,
  onSelectIcon,
}: IconSelectorProps) {
  return (
    <ScrollView className="mb-4">
      <View className="flex-row flex-wrap justify-between">
        {AVAILABLE_ICONS.map((icon) => (
          <TouchableOpacity
            key={icon.name}
            className={`p-3 m-2 rounded-xl items-center justify-center w-20 h-24
              ${selectedIcon === icon.name ? "bg-primary" : "bg-gray-100"}`}
            onPress={() => onSelectIcon(icon.name)}
          >
            <Ionicons
              name={icon.name as any}
              size={32}
              color={selectedIcon === icon.name ? "white" : "#333"}
            />
            <Text
              className={`text-xs mt-2 text-center
                ${selectedIcon === icon.name ? "text-white" : "text-gray-700"}`}
              numberOfLines={1}
            >
              {icon.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
