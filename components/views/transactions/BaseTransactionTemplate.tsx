import { Category } from "@/contexts/CategoriesContext";
import { Wallet } from "@/lib/database/sqliteService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import AmountSheet from "./AmountSheet";
import CategorySheet from "./CategorySheet";
import DateTimePickerComponent from "./DateTimePicker";
import ObjectiveSelector from "./ObjectiveSelector";

interface BaseTransactionTemplateProps {
  mode: "add" | "edit";
  title: string;
  setTitle: (title: string) => void;
  note: string;
  setNote: (note: string) => void;
  category: Category | null;
  setCategory: (category: Category | null) => void;
  type: "expense" | "income";
  setType: (type: "expense" | "income") => void;
  amount: string;
  setAmount: (amount: string) => void;
  selectedWallet: Wallet | null;
  setSelectedWallet: (wallet: Wallet | null) => void;
  wallets: Wallet[];
  categories: Category[];
  isLoadingWallets?: boolean;
  isLoadingCategories?: boolean;
  onComplete: () => Promise<boolean>;
  onCancel?: () => void;
  headerTitle?: string;
  isProcessing?: boolean;
  children?: ReactNode;
  timestamp?: number;
  setTimestamp?: (timestamp: number) => void;
  showDateTimePicker?: boolean;
  objective_id?: string;
  setObjectiveId?: (id?: string) => void;
}

export default function BaseTransactionTemplate({
  mode,
  title,
  setTitle,
  note,
  setNote,
  category,
  setCategory,
  type,
  setType,
  amount,
  setAmount,
  selectedWallet,
  setSelectedWallet,
  wallets,
  categories,
  isLoadingWallets = false,
  isLoadingCategories = false,
  onComplete,
  onCancel,
  headerTitle,
  isProcessing = false,
  children,
  timestamp,
  setTimestamp,
  showDateTimePicker = true,
  objective_id,
  setObjectiveId,
}: BaseTransactionTemplateProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"expense" | "income">(type);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showAmountSheet, setShowAmountSheet] = useState(false);

  // Estado para guardar el ancho del contenedor de tabs
  const tabContainerWidth = useSharedValue(0);
  // Valor animado para la posición del tab
  const animatedTab = useSharedValue(type === "expense" ? 0 : 1);

  // Estilo animado para el indicador de tab
  const animatedTabStyle = useAnimatedStyle(() => {
    const tabWidth = tabContainerWidth.value / 2;
    return {
      width: tabWidth,
      transform: [
        {
          translateX: animatedTab.value * tabWidth,
        },
      ],
    };
  });

  // Sincronizar el tab con el tipo de transacción
  useEffect(() => {
    animatedTab.value = withSpring(type === "expense" ? 0 : 1, {
      damping: 15,
      stiffness: 120,
    });
    setSelectedTab(type);
  }, [type, animatedTab]);

  const handleTabPress = (tab: "expense" | "income") => {
    setSelectedTab(tab);
    setType(tab);
    animatedTab.value = withSpring(tab === "expense" ? 0 : 1, {
      damping: 15,
      stiffness: 120,
    });
  };

  const onTabContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    tabContainerWidth.value = width;
  };

  const handleSave = async () => {
    const success = await onComplete();
    if (success) {
      router.back();
    }
  };

  const handleCategorySelect = (selectedCategory: Category, selectedType: "expense" | "income") => {
    setCategory(selectedCategory);
    setType(selectedType);
    setShowCategorySheet(false);
  };

  const handleAmountComplete = (newAmount: string) => {
    setAmount(newAmount);
    setShowAmountSheet(false);
  };

  // Filtrar categorías según el tipo seleccionado
  const filteredCategories = categories.filter(
    (cat) => cat.type === type
  );

  // Helper para obtener el balance a mostrar (disponible para tarjetas, balance para cuentas)
  const getDisplayBalance = (wallet: Wallet) => {
    if (wallet.type === 'credit' && wallet.credit_limit) {
      // Para tarjetas: mostrar crédito disponible
      return wallet.credit_limit - (wallet.net_balance || wallet.balance);
    }
    // Para cuentas regulares: mostrar balance actual
    return wallet.net_balance || wallet.balance;
  };

  // Renderizar wallet item
  const renderWalletItem = ({ item }: { item: Wallet }) => {
    const isSelected = selectedWallet?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.walletItem, isSelected && styles.selectedWalletItem]}
        onPress={() => setSelectedWallet(item)}
      >
        <View style={[styles.walletIcon, { backgroundColor: item.color }]}>
          <Text style={styles.walletIconText}>{item.icon}</Text>
        </View>
        <View style={styles.walletInfo}>
          <Text style={[styles.walletName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <Text style={styles.walletBalance}>
            ${getDisplayBalance(item).toFixed(2)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#7952FC"
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between pt-12 px-5 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4" onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">
            {headerTitle || (mode === "add" ? "Agregar transacción" : "Editar transacción")}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-lg"
          onPress={handleSave}
          disabled={isProcessing || !category || parseFloat(amount) <= 0 || !selectedWallet}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">
              {mode === "add" ? "Guardar" : "Actualizar"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              className="py-3 z-10"
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

        {/* Amount Section */}
        <TouchableOpacity
          className="bg-primary/40 p-6"
          onPress={() => setShowAmountSheet(true)}
          activeOpacity={0.7}
        >
          <Text className="text-white/70 text-sm mb-2">Monto</Text>
          <Text className="text-5xl font-bold text-white">${amount}</Text>
        </TouchableOpacity>

        {/* Category Section */}
        <View className="bg-white p-4">
          <Text className="text-gray-600 text-sm mb-3">Categoría</Text>
          {isLoadingCategories ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#7952FC" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-2"
            >
              {filteredCategories.map((cat, index) => (
                <Animated.View
                  entering={FadeInUp.delay(index * 50).duration(200)}
                  key={cat.id}
                >
                  <TouchableOpacity
                    className={`mr-3 p-3 rounded-xl items-center justify-center w-20 ${
                      category?.id === cat.id ? "bg-primary" : "bg-gray-100"
                    }`}
                    onPress={() => {
                      setCategory(cat);
                    }}
                  >
                    <Text className="text-3xl mb-1">{cat.icon}</Text>
                    <Text
                      className={`text-xs text-center ${
                        category?.id === cat.id ? "text-white font-bold" : "text-gray-700"
                      }`}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
              <TouchableOpacity
                className="mr-3 p-3 rounded-xl items-center justify-center w-20 bg-gray-100 border-2 border-dashed border-gray-300"
                onPress={() => setShowCategorySheet(true)}
              >
                <Ionicons name="add" size={32} color="#666" />
                <Text className="text-xs text-center text-gray-600 mt-1">
                  Más
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Wallet Section */}
        <View className="bg-white p-4 border-t border-gray-100">
          <Text className="text-gray-600 text-sm mb-3">Cuenta</Text>
          {isLoadingWallets ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#7952FC" />
            </View>
          ) : wallets.length === 0 ? (
            <Text className="text-gray-500 italic">No hay cuentas disponibles</Text>
          ) : (
            <FlatList
              data={wallets}
              renderItem={renderWalletItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            />
          )}
        </View>

        {/* Objective Section */}
        {setObjectiveId && (
          <View className="bg-white p-4 border-t border-gray-100">
            <Text className="text-gray-600 text-sm mb-3">Objetivo (Opcional)</Text>
            <ObjectiveSelector
              selectedObjectiveId={objective_id}
              onSelect={setObjectiveId}
              transactionType={type}
            />
          </View>
        )}

        {/* Transaction Details */}
        <View className="bg-white p-4 border-t border-gray-100">
          <Text className="text-gray-600 text-sm mb-3">Detalles</Text>
          <TextInput
            placeholder="Título de la transacción"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            className="text-black text-lg font-semibold bg-gray-50 p-3 rounded-lg mb-3"
          />
          <TextInput
            placeholder="Nota (opcional)"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            className="text-black text-base bg-gray-50 p-3 rounded-lg"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Date Time Picker */}
        {showDateTimePicker && timestamp !== undefined && setTimestamp && (
          <DateTimePickerComponent
            timestamp={timestamp}
            onChange={setTimestamp}
          />
        )}

        {/* Children for additional fields */}
        {children}
      </ScrollView>

      {/* Category Sheet */}
      <CategorySheet
        visible={showCategorySheet}
        onSelectCategory={handleCategorySelect}
        onClose={() => setShowCategorySheet(false)}
      />

      {/* Amount Sheet */}
      <AmountSheet
        visible={showAmountSheet}
        category={category}
        transactionType={type}
        onComplete={handleAmountComplete}
        onClose={() => setShowAmountSheet(false)}
        amount={amount}
        setAmount={setAmount}
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
    backgroundColor: "#7952FC",
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
  walletItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    minWidth: 160,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  selectedWalletItem: {
    borderColor: "#7952FC",
    backgroundColor: "rgba(121, 82, 252, 0.1)",
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  walletIconText: {
    fontSize: 18,
    color: "white",
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 14,
    fontWeight: "500",
  },
  walletBalance: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedText: {
    color: "#7952FC",
    fontWeight: "700",
  },
  checkIcon: {
    marginLeft: 5,
  },
});
