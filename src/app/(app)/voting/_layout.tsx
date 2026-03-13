import { Stack } from 'expo-router';

export default function VotingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[poll_id]/ballot" />
      <Stack.Screen name="[poll_id]/candidate/[candidate_id]" />
      <Stack.Screen name="[poll_id]/candidate/[candidate_id]/qa" />
      <Stack.Screen name="[poll_id]/submit-profile" />
      <Stack.Screen name="[poll_id]/confirmation" />
    </Stack>
  );
}
