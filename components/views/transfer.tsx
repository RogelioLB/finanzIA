import { Account } from "@/lib/models/types";
import Animated, { FadeIn } from "react-native-reanimated";

import { Picker } from "@react-native-picker/picker";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface TransferFormViewProps {
  accountsWithBalance: Account[];
  availableDestinationAccounts: Account[];
  fromAccount: string;
  toAccount: string;
  amount: string;
  error: string | null;
  setFromAccount: (id: string) => void;
  setToAccount: (id: string) => void;
  setAmount: (amount: string) => void;
  handleTransfer: () => void;
}

export const TransferFormView = ({
  accountsWithBalance,
  availableDestinationAccounts,
  fromAccount,
  toAccount,
  amount,
  error,
  setFromAccount,
  setToAccount,
  setAmount,
  handleTransfer,
}: TransferFormViewProps) => {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="mt-8">
      {/* Origen */}
      <View className="mb-4">
        <Text className="text-base font-medium mb-1">From Account</Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={fromAccount}
            onValueChange={(value) => setFromAccount(value)}
            style={{ height: 50, width: "100%", color: "black" }}
          >
            {accountsWithBalance.map((account) => (
              <Picker.Item
                key={account.id}
                label={`${account.name} (${account.balance} ${account.currency})`}
                value={account.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Destino */}
      <View className="mb-4">
        <Text className="text-base font-medium mb-1">To Account</Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={toAccount}
            onValueChange={(value) => setToAccount(value)}
            style={{ height: 50, width: "100%", color: "black" }}
            enabled={fromAccount !== ""}
          >
            <Picker.Item label="Select destination account" value="" />
            {availableDestinationAccounts.map((account) => (
              <Picker.Item
                key={account.id}
                label={`${account.name} (${account.balance} ${account.currency})`}
                value={account.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Cantidad */}
      <View className="mb-4">
        <Text className="text-base font-medium mb-1">Amount</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 placeholder:text-gray-400"
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* Mensajes de error */}
      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {/* Alerta de éxito animada */}

      {/* Botón de transferencia */}
      <TouchableOpacity
        className="mt-4"
        onPress={handleTransfer}
        disabled={!fromAccount || !toAccount || !amount}
      >
        <View
          className={`rounded-lg px-4 py-3 ${!fromAccount || !toAccount || !amount ? "bg-gray-400" : "bg-primary"}`}
        >
          <Text className="text-base text-white font-bold text-center">
            Transfer Funds
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
