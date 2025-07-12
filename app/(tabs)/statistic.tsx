import TransitionLayout from "@/components/ui/TransitionLayout";
import { StyleSheet, Text, View } from "react-native";

export default function StatisticScreen() {
  return (
    <TransitionLayout>
      <View style={styles.container}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
          }}
          className="text-white"
        >
          Statistic Screen
        </Text>
      </View>
    </TransitionLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
