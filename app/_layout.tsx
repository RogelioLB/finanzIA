import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MenuProvider } from "react-native-popup-menu";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { AddTransactionProvider } from "@/contexts/AddTransactionContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { CreditCardsProvider } from "@/contexts/CreditCardsContext";
import { ObjectivesProvider } from "@/contexts/ObjectivesContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { WalletsProvider } from "@/contexts/WalletsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { initDatabase } from "@/lib/database/initDatabase";
import * as NavigationBar from "expo-navigation-bar";
import * as Updates from "expo-updates";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/**
 * Navigation guard that handles onboarding redirect
 * Must be used inside UserProvider
 */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isOnboardingComplete, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for user settings to load

    const inOnboarding = segments[0] === "onboarding";

    if (!isOnboardingComplete && !inOnboarding) {
      // Redirect to onboarding if not completed and not already there
      router.replace("/onboarding");
    } else if (isOnboardingComplete && inOnboarding) {
      // Redirect to home if onboarding is completed but user is on onboarding screen
      router.replace("/");
    }
  }, [isOnboardingComplete, isLoading, segments, router]);

  // Show loading screen while checking onboarding status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" }}>
        <ActivityIndicator size="large" color="#7952FC" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#7952FC");
      NavigationBar.setButtonStyleAsync("light");
      NavigationBar.setPositionAsync("absolute");
    }
  }, []);

  // Verificar y aplicar actualizaciones OTA
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return; // No verificar en desarrollo

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log("Error verificando actualizaciones:", error);
      }
    }

    checkForUpdates();
  }, []);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: "#FAFAFA" }}>
      <SQLiteProvider databaseName="financeapp.db" onInit={initDatabase}>
        <MenuProvider>
          <UserProvider>
            <WalletsProvider>
              <CategoriesProvider>
                <TransactionsProvider>
                  <ObjectivesProvider>
                    <CreditCardsProvider>
                      <ChatProvider>
                        <AddTransactionProvider>
                        <ThemeProvider
                          value={colorScheme !== "dark" ? DarkTheme : DefaultTheme}
                        >
                          <GestureHandlerRootView>
                            <NavigationGuard>
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
                                  name="onboarding"
                                  options={{
                                    headerShown: false,
                                    animation: "fade",
                                    gestureEnabled: false,
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
                                <Stack.Screen
                                  name="objectives"
                                  options={{
                                    title: "Objectives",
                                    headerShown: false,
                                    animation: "fade_from_bottom",
                                    animationDuration: 250,
                                  }}
                                />
                                <Stack.Screen
                                  name="credit-cards"
                                  options={{
                                    title: "Credit Cards",
                                    headerShown: false,
                                    animation: "fade_from_bottom",
                                    animationDuration: 250,
                                  }}
                                />
                                <Stack.Screen
                                  name="settings"
                                  options={{
                                    title: "Settings",
                                    headerShown: false,
                                    animation: "fade_from_bottom",
                                    animationDuration: 250,
                                  }}
                                />
                                <Stack.Screen name="+not-found" />
                              </Stack>
                            </NavigationGuard>
                            <StatusBar style="dark" />
                          </GestureHandlerRootView>
                        </ThemeProvider>
                      </AddTransactionProvider>
                      </ChatProvider>
                    </CreditCardsProvider>
                  </ObjectivesProvider>
                </TransactionsProvider>
              </CategoriesProvider>
            </WalletsProvider>
          </UserProvider>
        </MenuProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
