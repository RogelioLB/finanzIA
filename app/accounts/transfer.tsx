import { useAccounts } from "@/hooks/useAccounts";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransferScreen() {
  const router = useRouter();
  const { accounts } = useAccounts();
  const [fromAccount, setFromAccount] = useState<string | null>(null);
  const [toAccount, setToAccount] = useState<string | null>(null);

  return (
    <SafeAreaView className="p-4">
      <View className="">
        <Text className="text-2xl font-bold">
          Transfer balance between accounts
        </Text>
        {accounts.length > 0 &&
        accounts.filter((account) => account.balance > 0).length < 1 ? (
          <View className="mt-8 p-8 items-center justify-center bg-gray-50 rounded-lg">
            <Text>Accounts without balance</Text>
            <TouchableOpacity
              className="mt-4"
              onPress={() => {
                router.push("/add-balance");
              }}
            >
              <View className="bg-primary rounded-lg px-4 py-2">
                <Text className="text-base text-white font-bold text-center">
                  Add balance to your accounts.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : accounts.length > 2 ? (
          <Picker
            style={{
              height: 50,
              width: "100%",
              color: "black",
              borderWidth: 1,
            }}
            dropdownIconColor={"black"}
            dropdownIconRippleColor={"gray"}
            className="border"
            selectedValue={fromAccount}
            onValueChange={(itemValue) => setFromAccount(itemValue)}
          >
            {accounts
              .filter((account) => account.balance > 0)
              .map((account) => (
                <Picker.Item
                  key={account.id}
                  label={account.name}
                  value={account.id}
                />
              ))}
          </Picker>
        ) : (
          <View className="mt-8 p-8 items-center justify-center bg-gray-50 rounded-lg">
            <Text className="text-black text-xl font-bold">
              Not enough accounts to transfer
            </Text>
            <Text className="text-gray-500 mt-2 text-sm text-center">
              You need at least 2 accounts to make transfers
            </Text>
            <TouchableOpacity
              className="mt-4"
              onPress={() => {
                router.push("/(tabs)/accounts");
              }}
            >
              <View className="bg-primary rounded-lg px-4 py-2">
                <Text className="text-base text-white font-bold text-center">
                  Manage your accounts and view your balance.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
