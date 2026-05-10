import { Stack } from 'expo-router';

export default function GalleryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Community Gallery' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Photo', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Photo Details' }} />
    </Stack>
  );
}
