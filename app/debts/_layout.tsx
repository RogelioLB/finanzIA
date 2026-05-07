import { Stack } from "expo-router";

export default function DebtsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="pay"
        options={{
          animation: "slide_from_bottom",
          animationDuration: 280,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
    </Stack>
  );
}
