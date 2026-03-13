import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, Redirect } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { userRole, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    if (!loading && (userRole === 'admin' || userRole === 'super_admin')) {
      authenticate();
    } else if (!loading) {
      setIsAuthenticating(false);
    }
  }, [loading, userRole]);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for devices without biometrics enabled/available during MVP testing
        // You could also force a password re-entry here instead.
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

  // Not an admin? 
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return <Redirect href="/(app)" />;
  }

  // Admin but failed biometric authentication?
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="security" size={48} color="#ef4444" />
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
