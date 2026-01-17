import { triggerLightTap } from "@/hooks/useHaptics";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Icon, { IconProps } from "./ui/Icon";
const quickActions: {
  name: string;
  icon: IconProps["name"];
  color: string;
  text: string;
  href?: string;
}[] = [
  {
    name: "transfer",
    icon: "transfer",
    color: "#7952FC",
    text: "Transferir",
    href: "/wallets/transfer",
  },
  {
    name: "subscription",
    icon: "subscription",
    color: "#7952FC",
    text: "Suscripciones",
    href: "/subscriptions",
  },
  {
    name: "add-balance",
    icon: "add-balance",
    color: "#7952FC",
    text: "Agregar Saldo",
    href: "/wallets",
  },
  {
    name: "wallets",
    icon: "wallet",
    color: "#7952FC",
    text: "Cuentas",
    href: "/wallets",
  },
];

export default function QuickActions() {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-4 justify-between">
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.name}
          onPress={() => {
            triggerLightTap();
            router.push((action.href || "/wallets/" + action.name) as any);
          }}
          className="flex-col justify-center items-center gap-1"
        >
          <View
            className="flex-row bg-[#EDE8FD] rounded-sm p-6 justify-center items-center gap-2"
            style={{ borderRadius: 16 }}
          >
            <Icon name={action.icon} size={32} color={action.color} />
          </View>
          <Text className="text-black">{action.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
