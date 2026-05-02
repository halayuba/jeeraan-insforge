import { Stack, useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef } from 'react';

export default function AuthLayout() {
  const { session, loading, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const currentSegment = segments[segments.length - 1];

  if (!isInitialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7f8' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  // NOTE: We now rely on UnifiedAuthGuard for redirects. 
  // Rendering the stack here avoids the "blank screen" during the transition to (app).


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
