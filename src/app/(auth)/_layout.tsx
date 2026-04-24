import { Stack, useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';

export default function AuthLayout() {
  const { session, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const currentSegment = segments[segments.length - 1];

  useEffect(() => {
    if (!loading && session && currentSegment !== 'create-neighborhood' && currentSegment !== 'admin-sign-in') {
      router.replace('/(app)');
    }
  }, [session, loading, currentSegment, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (session && currentSegment !== 'create-neighborhood' && currentSegment !== 'admin-sign-in') {
    return null;
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
