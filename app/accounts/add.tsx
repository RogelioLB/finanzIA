import IconSelector from "@/components/IconSelector";
import { useAccounts } from "@/hooks/useAccounts";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddAccountScreen() {
  const { addAccount, refresh } = useAccounts();
  const [accountName, setAccountName] = useState("");
  const [accountIcon, setAccountIcon] = useState("wallet-outline");
  const [accountBalance, setAccountBalance] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("USD");

  const currencies = ["USD", "EUR", "GBP", "JPY", "CNY", "MXN", "ARS"];

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        <View className="p-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text className="text-3xl font-bold">Create an Account</Text>
            <Text className="text-gray-500">Enter your account details</Text>
          </View>
        </View>

        <View className="px-4">
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">Account Name</Text>
            <TextInput
              placeholder="Account Name"
              value={accountName}
              onChangeText={setAccountName}
              className="border border-gray-300 rounded-lg px-4 py-4 placeholder:text-gray-400"
            />
          </View>
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">Balance</Text>
            <TextInput
              placeholder="Balance"
              value={accountBalance}
              onChangeText={setAccountBalance}
              inputMode="numeric"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-4 placeholder:text-gray-400"
            />
          </View>
          <View>
            <Text className="text-lg font-bold mb-2">Currency</Text>
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
              selectedValue={accountCurrency}
              onValueChange={(itemValue) => setAccountCurrency(itemValue)}
            >
              {currencies.map((currency) => (
                <Picker.Item key={currency} label={currency} value={currency} />
              ))}
            </Picker>
          </View>
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">Choose Icon</Text>
            <IconSelector
              selectedIcon={accountIcon}
              onSelectIcon={setAccountIcon}
            />
          </View>
        </View>
      </ScrollView>
      <View className="px-4">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl mt-4"
          onPress={async () => {
            await addAccount({
              name: accountName,
              balance: Number(accountBalance),
              currency: accountCurrency,
              icon: accountIcon,
            });
            refresh();
            router.back();
          }}
        >
          <Text className="text-white text-center font-bold text-lg">
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
