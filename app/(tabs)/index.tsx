import CardBalance from "@/components/CardBalance";
import QuickActions from "@/components/QuickActions";
import TransitionLayout from "@/components/ui/TransitionLayout";
import AccountsWidget from "@/widgets/accounts-widget";
import TransactionsWidget from "@/widgets/transactions-widget";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <TransitionLayout>
      <SafeAreaView>
        <ScrollView>
          <View className="p-4 gap-8">
            <AccountsWidget />
            <CardBalance />
            <QuickActions />
            <TransactionsWidget />
          </View>
        </ScrollView>
      </SafeAreaView>
    </TransitionLayout>
  );
}
