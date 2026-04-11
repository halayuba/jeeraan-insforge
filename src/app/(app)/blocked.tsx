import { ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function BlockedScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldAlert size={80} color="#ef4444" strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          Your account has been restricted by the neighborhood administrator due to a violation of community guidelines or established rules.
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            If you believe this is a mistake, please contact your neighborhood administrator directly.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: '#fee2e2',
    padding: 24,
    borderRadius: 64,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Manrope-SemiBold',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
});
