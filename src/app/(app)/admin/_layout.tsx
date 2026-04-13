import { Shield } from 'lucide-react-native';


import * as LocalAuthentication from 'expo-local-authentication';
import { Redirect, Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminLayout() {
  const { userRole, globalRole, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const isPrivileged = userRole === 'admin' || userRole === 'moderator' || globalRole === 'super_admin';

  useEffect(() => {
    if (!loading && isPrivileged) {
      authenticate();
    } else if (!loading) {
      setIsAuthenticating(false);
    }
  }, [loading, isPrivileged]);

  const authenticate = async () => {
    // Biometric bypass for Web platform
    if (Platform.OS === 'web') {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for devices without biometrics enabled/available during MVP testing
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Admin Dashboard',
        fallbackLabel: 'Use Device Passcode',
      });

      if (result.success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading || isAuthenticating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1193d4" />
        <Text style={styles.text}>Securing Dashboard...</Text>
      </View>
    );
  }

  // Not privileged? 
  if (!isPrivileged) {
    return <Redirect href="/(app)" />;
  }

  // Admin but failed biometric authentication?
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Shield size={48} color="#ef4444" strokeWidth={2} />
        <Text style={styles.text}>Authentication Failed</Text>
        <Text style={styles.subText}>You must verify your identity to access the admin panel.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f6f7f8' }}>
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
  },
  subText: {
    marginTop: 8,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  }
});
