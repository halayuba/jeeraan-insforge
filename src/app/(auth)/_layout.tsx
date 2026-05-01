import { Stack, useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef } from 'react';

export default function AuthLayout() {
  const { session, loading, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const isRedirecting = useRef(false);

  const currentSegment = segments[segments.length - 1];

  useEffect(() => {
    if (!isInitialized || loading) return;
    if (isRedirecting.current) return;

    if (session && currentSegment !== 'create-neighborhood' && currentSegment !== 'admin-sign-in') {
      isRedirecting.current = true;
      router.replace('/(app)' as any);
    } else {
      isRedirecting.current = false;
    }
  }, [isInitialized, loading, session]);

  if (!isInitialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7f8' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  // Prevent rendering stack during redirect
  if (session && currentSegment !== 'create-neighborhood' && currentSegment !== 'admin-sign-in') {
    return <View style={{ flex: 1, backgroundColor: '#f6f7f8' }} />;
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
