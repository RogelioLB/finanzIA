import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export const NoBalanceView = () => {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="mt-8 p-8 items-center justify-center bg-gray-50 rounded-lg"
    >
      <Text className="text-black text-xl font-bold">
        Cuentas sin saldo
      </Text>
      <Text className="text-gray-500 mt-2 text-sm text-center">
        Necesitas agregar saldo a tus cuentas primero
      </Text>
      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push("/wallets")}
      >
        <View className="bg-primary rounded-lg px-4 py-2">
          <Text className="text-base text-white font-bold text-center">
            Agregar saldo a cuentas
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
