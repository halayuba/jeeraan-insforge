import { Stack } from 'expo-router';

export default function GalleryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Community Gallery', headerBackTitle: 'Back' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Photo', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Photo Details' }} />
    </Stack>
  );
}
