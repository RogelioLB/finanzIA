import useBalance from "@/hooks/useBalance";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";

export default function CardBalance() {
  const { balances, loading, error } = useBalance();
  const currencies = Array.from(balances?.keys() || []);
  const selectedCurrency =
    currencies.findIndex((currency) => currency === "MXN") || 0;

  return (
    <View className="bg-[#7952FC] p-5 rounded-2xl w-full h-60 overflow-hidden relative">
      {/* Círculos decorativos siempre visibles */}
      <Circle size={129} opacity={0.1} />
      <Circle size={205} opacity={0.1} />
      <Circle size={281} opacity={0.05} />
      <Circle size={357} opacity={0.025} />

      {loading ? (
        // Indicador de carga centrado
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : error ? (
        // Mensaje de error animado
        <Animated.View
          entering={FadeIn.duration(500)}
          className="flex-1 justify-center items-center"
        >
          <Text className="text-white font-medium text-base text-center">
            {error}
          </Text>
        </Animated.View>
      ) : (
        // Contenido animado cuando los datos están listos
        <Animated.View
          className="justify-between flex-1"
          entering={SlideInUp.duration(1000).damping(0.5)}
        >
          <View>
            <Animated.Text className="text-white font-normal text-lg">
              My Balance
            </Animated.Text>

            <Animated.Text className="text-white font-semibold text-3xl">
              {balances && balances.size > 0
                ? `${balances.get(currencies[selectedCurrency])?.balance}`
                : "$0.00"}
            </Animated.Text>
          </View>
          <View className="flex-col">
            {currencies.length > 1 &&
              currencies
                .filter((currency) => currency !== currencies[selectedCurrency])
                .map((currency) => (
                  <Animated.Text
                    key={currency}
                    className="text-white/80 font-semibold text-lg"
                  >
                    {balances.get(currency)?.balance}
                  </Animated.Text>
                ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const Circle = ({ size, opacity }: { size: number; opacity: number }) => {
  return (
    <View
      className="bg-black rounded-full items-center justify-center"
      style={{
        borderRadius: 999,
        width: size,
        height: size,
        position: "absolute",
        top: "50%", // Posición fija en el centro aproximado (h-60 / 2 - size/2) = (240/2 - 129/2) = 55.5
        right: 0,
        transform: [
          { translateY: "-50%" }, // Mover la mitad del círculo fuera de la tarjeta
          { translateX: size / 2 }, // Mover la mitad del círculo fuera de la tarjeta
        ],
        opacity,
      }}
    ></View>
  );
};
