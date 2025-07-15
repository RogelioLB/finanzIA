import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomSheetBase from "./BottomSheetBase";
import { Category } from "./CategorySheet";

interface AmountSheetProps {
  category: Category | null;
  transactionType: "expense" | "income";
  onComplete: (amount: string) => void;
  onClose?: () => void;
  visible: boolean;
  amount: string;
  setAmount: (amount: string) => void;
}

export default function AmountSheet({
  category,
  transactionType,
  onComplete,
  onClose,
  visible,
  amount,
  setAmount,
}: AmountSheetProps) {
  const handleNumberPress = (num: string) => {
    if (amount === "0" && num !== ".") {
      setAmount(num);
    } else if (num === "." && amount.includes(".")) {
      return;
    } else {
      setAmount(amount + num);
    }
  };

  const handleDeletePress = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount("0");
    }
  };

  const handleDonePress = () => {
    if (amount !== "0") {
      onComplete(amount);
    }
  };

  return (
    <BottomSheetBase
      title="Ingresa el monto"
      visible={visible}
      onClose={onClose}
    >
      <View className="">
        <Text className="text-5xl font-bold text-right">${amount}</Text>
      </View>
      {/* Numeric keypad */}
      <View className="flex-row flex-wrap justify-between bg-slate-300 rounded-xl my-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
          (key) => (
            <TouchableOpacity
              key={key}
              className={`w-[33%] h-[50px] aspect-square flex items-center justify-center`}
              onPress={() => {
                if (key === "⌫") {
                  handleDeletePress();
                } else {
                  handleNumberPress(key);
                }
              }}
            >
              <Text className="text-white text-2xl font-medium">{key}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <TouchableOpacity
        className="bg-primary py-4 rounded-xl"
        onPress={handleDonePress}
      >
        <Text className="text-black text-center font-bold">Completar</Text>
      </TouchableOpacity>
    </BottomSheetBase>
  );
}
