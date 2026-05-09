import { Stack } from "expo-router";

export default function CreditCardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="add"
        options={{
          animation: "slide_from_bottom",
          animationDuration: 280,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen
        name="installments/add"
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
