import {
  DarkTheme,
  DefaultTheme,
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
import { InvestmentsProvider } from "@/contexts/InvestmentsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ObjectivesProvider } from "@/contexts/ObjectivesContext";
import { SubscriptionsProvider } from "@/contexts/SubscriptionsContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { WalletsProvider } from "@/contexts/WalletsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSubscriptionMonitor } from "@/hooks/useSubscriptionMonitor";
import { initDatabase } from "@/lib/database/initDatabase";
import { ThemeProvider } from "@/theme/ThemeProvider";
import * as NavigationBar from "expo-navigation-bar";
import * as Updates from "expo-updates";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastContainer } from "@/components/ui/Toast";

function SubscriptionMonitorInit() {
  useSubscriptionMonitor();
  return null;
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isOnboardingComplete, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!isOnboardingComplete && !inOnboarding) {
      router.replace("/onboarding");
    } else if (isOnboardingComplete && inOnboarding) {
      router.replace("/");
    }
  }, [isOnboardingComplete, isLoading, segments, router]);

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
      NavigationBar.setBackgroundColorAsync("#0A0A0A");
      NavigationBar.setButtonStyleAsync("light");
      NavigationBar.setPositionAsync("absolute");
    }
  }, []);

  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;

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
        <SubscriptionMonitorInit />
        <MenuProvider>
          <ThemeProvider>
            <UserProvider>
              <WalletsProvider>
                <CategoriesProvider>
                  <TransactionsProvider>
                    <InvestmentsProvider>
                      <SubscriptionsProvider>
                      <NotificationsProvider>
                        <ObjectivesProvider>
                          <CreditCardsProvider>
                            <ChatProvider>
                              <AddTransactionProvider>
                                <GestureHandlerRootView>
                                  <NavigationGuard>
                                    <View style={{ flex: 1 }}>
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
                                            title: "Cuentas",
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
                                            title: "Suscripciones",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen
                                          name="objectives"
                                          options={{
                                            title: "Objetivos",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen
                                          name="credit-cards"
                                          options={{
                                            title: "Tarjetas de Crédito",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen
                                          name="settings"
                                          options={{
                                            title: "Configuración",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen
                                          name="investments"
                                          options={{
                                            title: "Inversiones",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen
                                          name="debts"
                                          options={{
                                            title: "Deudas",
                                            headerShown: false,
                                            animation: "fade_from_bottom",
                                            animationDuration: 250,
                                          }}
                                        />
                                        <Stack.Screen name="+not-found" />
                                      </Stack>
                                    </View>
                                  </NavigationGuard>
                                  <StatusBar style="auto" />
                                </GestureHandlerRootView>
                              </AddTransactionProvider>
                            </ChatProvider>
                          </CreditCardsProvider>
                        </ObjectivesProvider>
                      </NotificationsProvider>
                      </SubscriptionsProvider>
                    </InvestmentsProvider>
                  </TransactionsProvider>
                </CategoriesProvider>
              </WalletsProvider>
            </UserProvider>
          </ThemeProvider>
        </MenuProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}