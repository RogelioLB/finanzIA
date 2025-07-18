import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomSheetBase from "../transactions/BottomSheetBase";

interface AmountBottomSheetProps {
  visible: boolean;
  amount: string;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onComplete: (amount: string) => void;
}

export default function AmountBottomSheet({
  visible,
  amount,
  onAmountChange,
  onClose,
  onComplete,
}: AmountBottomSheetProps) {
  
  // Funciones para el manejo del keypad numérico
  const handleNumberPress = (num: string) => {
    if (amount === "0" && num !== ".") {
      onAmountChange(num);
    } else if (num === "." && amount.includes(".")) {
      return;
    } else {
      onAmountChange(amount + num);
    }
  };

  const handleDeletePress = () => {
    if (amount.length > 1) {
      onAmountChange(amount.slice(0, -1));
    } else {
      onAmountChange("0");
    }
  };

  const handleDonePress = () => {
    if (parseFloat(amount) >= 0) {
      onComplete(amount);
    }
  };

  return (
    <BottomSheetBase
      title="Balance inicial"
      visible={visible}
      onClose={onClose}
    >
      {/* Display del monto */}
      <View style={styles.amountDisplay}>
        <Text style={styles.amountText}>${amount}</Text>
      </View>
      
      {/* Numeric keypad */}
      <View style={styles.keypadContainer}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
          (key) => (
            <TouchableOpacity
              key={key}
              style={styles.keypadButton}
              onPress={() => {
                if (key === "⌫") {
                  handleDeletePress();
                } else {
                  handleNumberPress(key);
                }
              }}
            >
              <Text style={styles.keypadButtonText}>{key}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.doneButton,
          parseFloat(amount) < 0 && styles.doneButtonDisabled,
        ]}
        onPress={handleDonePress}
        disabled={parseFloat(amount) < 0}
      >
        <Text style={styles.doneButtonText}>Confirmar</Text>
      </TouchableOpacity>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  amountDisplay: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amountText: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "right",
    color: "#333",
  },
  keypadContainer: {
    height: 250,
    backgroundColor: "#64748b", // bg-slate-500
    borderRadius: 12,
    marginVertical: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: 4,
  },
  keypadButton: {
    width: "32%", // Aproximadamente 33% menos padding
    height: "23%", // 4 filas, cada una ocupa ~25% menos padding
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  keypadButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#7952FC",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  doneButtonDisabled: {
    backgroundColor: "#ccc",
  },
  doneButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
