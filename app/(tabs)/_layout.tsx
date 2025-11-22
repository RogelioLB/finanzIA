import { AnimatedTabButton } from "@/components/AnimatedTabButton";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Defining the layout of the custom tab navigator
export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Tabs>
      <View className="flex-1 relative">
        <TabSlot />
        <TouchableHighlight
          onPress={() => {
            // Using type assertion to bypass type checking for external route
            router.navigate("/add-transaction");
          }}
          className="absolute bottom-10 right-8 z-10 bg-indigo-800 rounded-md p-3 "
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableHighlight>
      </View>
      <SafeAreaView edges={["bottom"]}>
        <View
          className={`flex-row justify-around items-center py-4 px-4 bg-[#7952FC] rounded-t-xl`}
        >
          <AnimatedTabButton
            name="Inicio"
            icon="home"
            href="/"
            isActive={pathname === "/"}
          />
          <AnimatedTabButton
            name="Transacciones"
            customIcon="cash-outline"
            href="/history"
            isActive={pathname === "/history" || pathname === "/history/index"}
          />
          <AnimatedTabButton
            name="AI Plan"
            icon="ai-plan"
            href="/ai-plan"
            isActive={pathname === "/ai-plan"}
          />
          <AnimatedTabButton
            name="More"
            customIcon="dot"
            href="/more"
            isActive={pathname === "/more"}
          />
        </View>
      </SafeAreaView>

      <TabList style={{ display: "none" }}>
        <TabTrigger name="inicio" href="/" />
        <TabTrigger name="transacciones" href="/history" />
        <TabTrigger name="ai plan" href="/ai-plan" />
        <TabTrigger name="more" href="/more" />
      </TabList>
    </Tabs>
  );
}
