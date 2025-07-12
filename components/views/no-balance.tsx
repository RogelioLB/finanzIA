import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export const NoBalanceView = () => {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className="mt-8 p-8 items-center justify-center bg-gray-50 rounded-lg"
    >
      <Text className="text-black text-xl font-bold">
        Accounts without balance
      </Text>
      <Text className="text-gray-500 mt-2 text-sm text-center">
        You need to add balance to your accounts first
      </Text>
      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push("/accounts/add-balance")}
      >
        <View className="bg-primary rounded-lg px-4 py-2">
          <Text className="text-base text-white font-bold text-center">
            Add balance to accounts
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
