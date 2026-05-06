import { Stack } from 'expo-router';

export default function InvestmentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Inversiones', headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Nueva Inversión', headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Editar Inversión', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle', headerShown: false }} />
    </Stack>
  );
}