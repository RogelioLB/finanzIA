import { useAccounts } from "@/hooks/useAccounts";
import { createAccount } from "@/lib/database/accountService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountsScreen() {
  const { accounts } = useAccounts();
  const handleAddAccount = async () => {
    const { success, data, error } = await createAccount({
      name: "New Account",
      icon: "cash-outline",
      color: "#7952FC",
      balance: 0,
      currency: "MXN",
    });
    Alert.alert(
      success ? "Account created successfully" : "Failed to create account"
    );
  };
  return (
    <SafeAreaView className="p-4">
      <View className="gap-4">
        <View className="flex-row justify-end">
          <TouchableOpacity
            className="bg-primary/80 rounded-full px-2 py-2"
            onPress={handleAddAccount}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View>
          <Text className="text-3xl font-bold">All Accounts</Text>
          <View className="flex-row flex-wrap gap-4">
            {accounts.map((account) => (
              <View key={account.id} className="bg-white rounded-lg p-4">
                <Text className="text-lg font-bold">{account.name}</Text>
                <Text className="text-gray-500">
                  {account.balance} {account.currency}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
