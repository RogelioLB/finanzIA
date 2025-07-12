import { StyleSheet, Text, View } from "react-native";
import TransitionLayout from "@/components/ui/TransitionLayout";

export default function ProfileScreen() {
  return (
    <TransitionLayout>
      <View style={styles.container}>
        <Text className="text-white" style={styles.title}>
          Profile
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
    color: "white",
  },
});
