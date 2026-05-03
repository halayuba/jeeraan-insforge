import { Stack } from 'expo-router';

export default function WhiteboardLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Daily Whiteboard', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
