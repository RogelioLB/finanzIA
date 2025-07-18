import { useAddTransaction } from "@/hooks/useAddTransaction";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
import TransactionFlow from "../../components/views/transactions/TransactionFlow";
import { TransactionData } from "../../contexts/AddTransactionContext";

export default function AddTransactionScreen() {
  const router = useRouter();
  const {
    amount,
    setAmount,
    category,
    type,
    title,
    setTitle,
    note,
    setNote,
    setCategory,
    setType,
    selectedWallet,
    setSelectedWallet,
    isCreating,
    createTransaction,
    resetTransaction,
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
      {/* Header */}
      <View className="flex-row items-center pt-12 px-5 pb-4">
        <TouchableOpacity className="mr-4" onPress={() => router.back()}>
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
                (selectedTab === "expense" || type === "expense") &&
                  styles.activeTabText,
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
                (selectedTab === "income" || type === "income") &&
                  styles.activeTabText,
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
      <View
        className="bg-gray-950 p-4"
        pointerEvents={flowVisible ? "none" : "auto"}
      >
        <TextInput
          placeholder="Título de la transacción"
          value={title}
          onChangeText={setTitle}
          className="text-white text-lg font-semibold"
          editable={!flowVisible}
        />
        <TextInput
          placeholder="Nota (opcional)"
          value={note}
          onChangeText={setNote}
          className="text-white/70 text-sm mt-2"
          multiline
          editable={!flowVisible}
        />
      </View>

      {/* Transaction flow bottom sheets */}
      <TransactionFlow
        visible={flowVisible}
        onComplete={async (data) => {
          setCompletedTransaction(data);
          setTransactionComplete(true);
          setFlowVisible(false);

          // Crear la transacción
          const success = await createTransaction();

          if (success) {
            resetTransaction();
            router.replace("/");
          } else {
            // Mostrar error o permitir reintentar
            console.error("Error creating transaction");
            setFlowVisible(true);
          }
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
