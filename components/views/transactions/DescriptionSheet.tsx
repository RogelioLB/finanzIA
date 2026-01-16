import { useAddTransaction } from "@/hooks/useAddTransaction";
import React, { useState, useEffect } from "react";
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
  // Obtener setTitle del contexto para sincronizar al avanzar
  const { title: contextTitle, setTitle } = useAddTransaction();

  // Estado local para evitar re-renders del contexto mientras se escribe
  const [localTitle, setLocalTitle] = useState(contextTitle);

  // Sincronizar estado local cuando el contexto cambia (ej: reset)
  useEffect(() => {
    setLocalTitle(contextTitle);
  }, [contextTitle]);

  const handleNext = () => {
    // Cerrar el teclado ANTES de cambiar de paso
    Keyboard.dismiss();

    // Sincronizar con el contexto
    setTitle(localTitle);

    // Esperar a que el teclado se cierre antes de avanzar
    setTimeout(() => {
      onNext(localTitle);
    }, 100);
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
          className="bg-primary/30 rounded-xl text-black p-4 mb-2 "
          placeholder="Descripción (opcional)"
          placeholderTextColor="black"
          value={localTitle}
          onChangeText={setLocalTitle}
          returnKeyType="next"
          onSubmitEditing={handleNext}
          autoFocus={false}
          showSoftInputOnFocus={true}
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
