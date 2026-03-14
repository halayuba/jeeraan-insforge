import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  const currentSegment = segments[segments.length - 1];

  if (session && currentSegment !== 'create-neighborhood' && currentSegment !== 'admin-sign-in') {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="neighborhood-access" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="create-neighborhood" />
      <Stack.Screen name="admin-sign-in" />
    </Stack>
  );
}
