import { AnimatedTabButton } from "@/components/AnimatedTabButton";
import { usePathname } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Defining the layout of the custom tab navigator
export default function Layout() {
  const pathname = usePathname();

  return (
    <Tabs>
      <TabSlot />
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-8 right-8"
      >
        <View
          className={`flex-row justify-around items-center py-3 px-4 bg-[#7952FC] rounded-full h-20 ${
            Platform.OS === "android" ? "mb-2" : ""
          }`}
        >
          <AnimatedTabButton
            name="Inicio"
            icon="home"
            href="/"
            isActive={pathname === "/"}
          />
          <AnimatedTabButton
            name="Statistic"
            icon="statistics"
            href="/statistic"
            isActive={pathname === "/statistic"}
          />
          <AnimatedTabButton
            name="AI Plan"
            icon="ai-plan"
            href="/ai-plan"
            isActive={pathname === "/ai-plan"}
          />
          <AnimatedTabButton
            name="Accounts"
            icon="accounts"
            customIcon="cash-sharp"
            href="/accounts"
            isActive={pathname === "/accounts"}
          />
          <AnimatedTabButton
            name="Profile"
            icon="profile"
            href="/profile"
            isActive={pathname === "/profile"}
          />
        </View>
      </SafeAreaView>
      <TabList style={{ display: "none" }}>
        <TabTrigger name="inicio" href="/" />
        <TabTrigger name="statistic" href="/statistic" />
        <TabTrigger name="ai plan" href="/ai-plan" />
        <TabTrigger name="accounts" href="/accounts" />
        <TabTrigger name="profile" href="/profile" />
      </TabList>
    </Tabs>
  );
}
