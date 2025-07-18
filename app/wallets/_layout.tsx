import { Stack } from "expo-router";

export default function WalletsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-wallet" />
    </Stack>
  );
}
