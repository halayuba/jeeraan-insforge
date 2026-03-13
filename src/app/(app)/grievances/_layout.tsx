import { Stack } from 'expo-router';

export default function GrievancesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="submit" />
    </Stack>
  );
}
