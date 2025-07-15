import { useAddTransaction } from "@/hooks/useAddTransaction";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Category } from "../../components/views/transactions/CategorySheet";
import TransactionFlow from "../../components/views/transactions/TransactionFlow";

interface TransactionData {
  description: string;
  category: Category | null;
  type: "expense" | "income";
  amount: string;
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const {
    amount,
    setAmount,
    category,
    type,
    description,
    setDescription,
    setCategory,
    setType,
  } = useAddTransaction();
  const [flowVisible, setFlowVisible] = useState(true);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<TransactionData | null>(null);
  const [selectedTab, setSelectedTab] = useState<"expense" | "income">(
    "expense"
  );
  // Estado para guardar el ancho del contenedor de tabs (necesario para calcular posiciones)
  const tabContainerWidth = useSharedValue(0);
  // Valor animado para la posición del tab
  const animatedTab = useSharedValue(0);

  // Estilo animado para el indicador de tab
  const animatedTabStyle = useAnimatedStyle(() => {
    // Calculamos la mitad del ancho del contenedor (ancho de cada tab)
    const tabWidth = tabContainerWidth.value / 2;

    return {
      width: tabWidth,
      transform: [
        {
          // Multiplicamos por el ancho de cada tab para obtener la posición
          translateX: animatedTab.value * tabWidth,
        },
      ],
    };
  });

  // Configurar animación inicial
  useEffect(() => {
    // Animación con spring para dar un efecto suave
    animatedTab.value = selectedTab === "expense" ? 0 : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    animatedTab.value = withSpring(type === "expense" ? 0 : 1, {
      damping: 15,
      stiffness: 120,
    });
  }, [type, animatedTab]);

  const handleTabPress = (tab: "expense" | "income") => {
    setSelectedTab(tab);
    // Animar a la posición correspondiente (0 para expense, 1 para income)
    animatedTab.value = withSpring(tab === "expense" ? 0 : 1, {
      damping: 15, // Menos amortiguamiento para más rebote
      stiffness: 120, // Mayor rigidez para movimiento más rápido
    });
  };

  // Función para medir el layout del contenedor de tabs
  const onTabContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    tabContainerWidth.value = width;
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center pt-12 px-5 pb-4">
        <TouchableOpacity className="mr-4" onPress={() => router.push("/")}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">
          Agregar transacción
        </Text>
      </View>

      {/* Tabs */}
      <View className="">
        <View
          className="flex-row relative bg-primary/40 overflow-hidden"
          onLayout={onTabContainerLayout}
        >
          {/* Background animado */}
          <Animated.View
            className="absolute top-0 bottom-0 bg-primary"
            style={[animatedTabStyle, styles.tabIndicator]}
          />

          {/* Botones de tab */}
          <TouchableOpacity
            className="py-3 z-10 "
            style={styles.tab}
            onPress={() => handleTabPress("expense")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "expense" && styles.activeTabText,
              ]}
            >
              Gasto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 z-10"
            style={styles.tab}
            onPress={() => handleTabPress("income")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "income" && styles.activeTabText,
              ]}
            >
              Ingreso
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="bg-primary/40 p-4">
        <View className="flex-row items-center justify-between">
          <View className="bg-gray-600 p-4 rounded-lg size-24 items-center justify-center">
            <Text className="font-bold text-white text-5xl">
              {category?.icon}
            </Text>
          </View>
          <View>
            <Text className="text-5xl font-bold text-white">${amount}</Text>
          </View>
        </View>
      </View>
      <View className="bg-gray-950 p-4">
        <TextInput
          placeholder="Descripción"
          value={description}
          onChangeText={setDescription}
          className="text-white"
        />
      </View>

      {/* Transaction flow bottom sheets */}
      <TransactionFlow
        visible={flowVisible}
        onComplete={(data) => {
          setCompletedTransaction(data);
          setTransactionComplete(true);
          setFlowVisible(false);

          // Auto-navigate back after showing success for 1 second
          setTimeout(() => {
            router.replace("/");
          }, 1000);
        }}
        onCancel={() => {
          setFlowVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabIndicator: {
    backgroundColor: "#7952FC", // Color morado que coincide con la UI de tabs
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  activeTabText: {
    color: "white",
    fontWeight: "700",
  },
});
