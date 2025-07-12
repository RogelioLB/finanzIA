import CardBalance from "@/components/CardBalance";
import QuickActions from "@/components/QuickActions";
import Icon from "@/components/ui/Icon";
import TransitionLayout from "@/components/ui/TransitionLayout";
import { StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <TransitionLayout>
      <SafeAreaView edges={["top"]} style={{ paddingTop: insets.top }}>
        <View className="p-4 gap-8">
          <View className="flex-row items-center gap-4">
            <View
              style={{
                backgroundColor: "#7952FC",
                borderRadius: 999,
                width: 56, // equivalente a w-14 (14 * 4px)
                height: 56, // equivalente a h-14
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="profile" size={24} color="#fff" />
            </View>
            <Text className="text-black flex-1 font-semibold text-base">
              Jhon
            </Text>
            <View
              style={{
                borderRadius: 999,
                width: 56, // equivalente a w-14 (14 * 4px)
                height: 56, // equivalente a h-14
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#DCDCDC",
                borderStartStartRadius: 999,
                borderEndStartRadius: 999,
                borderStartEndRadius: 999,
                borderEndEndRadius: 999,
              }}
            >
              <Icon name="notification" size={24} color="#7952FC" />
            </View>
          </View>
          <CardBalance />
          <QuickActions />
        </View>
      </SafeAreaView>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
