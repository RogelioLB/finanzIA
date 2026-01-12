import CardBalance from "@/components/CardBalance";
import DonationModal from "@/components/DonationModal";
import QuickActions from "@/components/QuickActions";
import TransitionLayout from "@/components/ui/TransitionLayout";
import { useUser } from "@/contexts/UserContext";
import AccountsWidget from "@/widgets/accounts-widget";
import CreditCardsWidget from "@/widgets/credit-cards-widget";
import ObjectivesWidget from "@/widgets/objectives-widget";
import TransactionsWidget from "@/widgets/transactions-widget";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Widget registry - maps widget type to component
const WIDGET_COMPONENTS: Record<string, React.FC> = {
  accounts: AccountsWidget,
  balance: CardBalance,
  quick_actions: QuickActions,
  credit_cards: CreditCardsWidget,
  objectives: ObjectivesWidget,
  transactions: TransactionsWidget,
};

export default function HomeScreen() {
  const router = useRouter();
  const { widgets, userName, isOnboardingComplete } = useUser();

  // Sort widgets by position and filter enabled ones
  const enabledWidgets = widgets
    .filter((w) => w.is_enabled === 1)
    .sort((a, b) => a.position - b.position);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <TransitionLayout>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header with greeting */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {userName ? (
                <>
                  <Text style={styles.greeting}>{getGreeting()},</Text>
                  <Text style={styles.userName}>{userName}</Text>
                </>
              ) : (
                <Text style={styles.appName}>FinanzIA</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push("/settings/widgets")}
            >
              <Ionicons name="options-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Widgets */}
          <View style={styles.widgetsContainer}>
            {enabledWidgets.length > 0 ? (
              enabledWidgets.map((widget) => {
                const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];
                if (!WidgetComponent) return null;
                return (
                  <View key={widget.id} style={styles.widgetWrapper}>
                    <WidgetComponent />
                  </View>
                );
              })
            ) : (
              // Fallback to default widgets if none configured
              <>
                <View style={styles.widgetWrapper}>
                  <AccountsWidget />
                </View>
                <View style={styles.widgetWrapper}>
                  <CardBalance />
                </View>
                <View style={styles.widgetWrapper}>
                  <QuickActions />
                </View>
                <View style={styles.widgetWrapper}>
                  <TransactionsWidget />
                </View>
              </>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Donation Modal - shows every 2 days */}
        <DonationModal />
      </SafeAreaView>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7952FC",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetsContainer: {
    paddingHorizontal: 16,
  },
  widgetWrapper: {
    marginBottom: 16,
  },
});
