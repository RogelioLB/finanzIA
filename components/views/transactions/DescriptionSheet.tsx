import { useAddTransaction } from "@/hooks/useAddTransaction";
import React from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheetBase from "./BottomSheetBase";

interface DescriptionSheetProps {
  onNext: (description: string) => void;
  onClose?: () => void;
  visible: boolean;
}

export default function DescriptionSheet({
  onNext,
  onClose,
  visible,
}: DescriptionSheetProps) {
  // Usamos el estado compartido del contexto
  const { description, setDescription } = useAddTransaction();

  const handleNext = () => {
    Keyboard.dismiss();
    onNext(description);
  };

  return (
    <BottomSheetBase
      title="Agregar transacción"
      visible={visible}
      onClose={onClose}
    >
      <View className="mb-6">
        <Text className="text-white text-base mb-2">
          Describe tu transacción
        </Text>
        <TextInput
          className="bg-white bg-opacity-10 rounded-xl text-white p-4 mb-2"
          placeholder="Descripción (opcional)"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={description}
          onChangeText={setDescription}
        />
        <Text className="text-gray-400 text-xs">
          Por ejemplo: Compras del supermercado, Pago de servicios, etc.
        </Text>
      </View>

      <TouchableOpacity
        className="bg-primary py-3 rounded-xl"
        onPress={handleNext}
      >
        <Text className="text-white text-center font-bold">Siguiente</Text>
      </TouchableOpacity>
    </BottomSheetBase>
  );
}
