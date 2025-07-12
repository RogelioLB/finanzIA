import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MenuProvider } from "react-native-popup-menu";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { useColorScheme } from "@/hooks/useColorScheme";
import { initDatabase } from "@/lib/database/database";
import { SQLiteProvider } from "expo-sqlite";
import { AccountsProvider } from "@/contexts/AccountsContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: "#FAFAFA" }}>
      <MenuProvider>
        <ThemeProvider
          value={colorScheme !== "dark" ? DarkTheme : DefaultTheme}
        >
          <SQLiteProvider
            databaseName="finance.db"
            onInit={async () => {
              console.log("Database initialized");
              await initDatabase();
              console.log("Database initialized");
            }}
          >
            <AccountsProvider>
              <Stack
                screenOptions={{
                  animation: "slide_from_right",
                  animationDuration: 300,
                  headerShown: false,
                }}
              >
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 250,
                  }}
                />
                <Stack.Screen
                  name="accounts"
                  options={{
                    title: "Accounts",
                    headerShown: false,
                    animation: "fade_from_bottom",
                    animationDuration: 250,
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </AccountsProvider>
          </SQLiteProvider>
        </ThemeProvider>
      </MenuProvider>
    </SafeAreaProvider>
  );
}
