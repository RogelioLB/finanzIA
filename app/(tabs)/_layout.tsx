import { usePathname, useRouter } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { Keyboard, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import AppTabBar from "@/components/navigation/AppTabBar";
import QuickExpenseSheet from "@/components/sheets/QuickExpenseSheet";
import { ToastContainer } from "@/components/ui/Toast";

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const shouldHideTabBar = isKeyboardVisible && pathname === "/ai-plan";

  const openSheet = () => setSheetOpen(true);

  return (
    <View style={{ flex: 1 }}>
      <Tabs>
        <View className="flex-1 relative">
          <TabSlot />
        </View>
        {!shouldHideTabBar && (
          <SafeAreaView edges={["bottom"]}>
            <AppTabBar onFabPress={openSheet} />
          </SafeAreaView>
        )}

        <TabList style={{ display: "none" }}>
          <TabTrigger name="inicio" href="/" />
          <TabTrigger name="expenses" href="/expenses" />
          <TabTrigger name="debts" href="/debts" />
          <TabTrigger name="more" href="/more" />
        </TabList>
      </Tabs>
      <QuickExpenseSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      <ToastContainer />
    </View>
  );
}