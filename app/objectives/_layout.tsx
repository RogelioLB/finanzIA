import { Stack } from "expo-router";

export default function ObjectivesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen
        name="add-debt"
        options={{
          animation: "slide_from_bottom",
          animationDuration: 280,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
