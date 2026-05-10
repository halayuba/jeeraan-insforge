import { Stack } from 'expo-router';

export default function WhiteboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Daily Whiteboard' }} />
    </Stack>
  );
}
