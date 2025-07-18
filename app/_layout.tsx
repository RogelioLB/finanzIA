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

import { AddTransactionProvider } from "@/contexts/AddTransactionContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import { WalletsProvider } from "@/contexts/WalletsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { initDatabase } from "@/lib/database/initDatabase";
import * as NavigationBar from "expo-navigation-bar";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#7952FC");
    NavigationBar.setButtonStyleAsync("light");
    NavigationBar.setPositionAsync("absolute");
  }, []);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: "#FAFAFA" }}>
      <SQLiteProvider databaseName="financeapp.db" onInit={initDatabase}>
        <MenuProvider>
          <WalletsProvider>
            <CategoriesProvider>
              <TransactionsProvider>
                <AddTransactionProvider>
                  <ThemeProvider
                    value={colorScheme !== "dark" ? DarkTheme : DefaultTheme}
                  >
                    <GestureHandlerRootView>
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
                        <Stack.Screen
                          name="add-transaction"
                          options={{
                            headerShown: false,
                            animationDuration: 250,
                          }}
                        />
                        <Stack.Screen
                          name="subscriptions"
                          options={{
                            title: "Subscriptions",
                            headerShown: false,
                            animation: "fade_from_bottom",
                            animationDuration: 250,
                          }}
                        />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <StatusBar style="dark" />
                    </GestureHandlerRootView>
                  </ThemeProvider>
                </AddTransactionProvider>
              </TransactionsProvider>
            </CategoriesProvider>
          </WalletsProvider>
        </MenuProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
