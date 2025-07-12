import { Text, View } from "react-native";

export default function CardBalance() {
  return (
    <View className="bg-[#7952FC] p-5 rounded-2xl w-full h-60 overflow-hidden relative">
      <Text className="text-white font-normal text-lg">My Balance</Text>
      <Text className="text-white font-semibold text-3xl">$61,295.40</Text>
      <Circle size={129} opacity={0.1} />
      <Circle size={205} opacity={0.1} />
      <Circle size={281} opacity={0.05} />
      <Circle size={357} opacity={0.025} />
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
