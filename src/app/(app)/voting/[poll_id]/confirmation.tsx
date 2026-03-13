import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ConfirmationScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/voting' as any)}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111618" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Board Election Ballot</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Confirmation Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="how-to-vote" size={56} color="#1193d4" />
        </View>

        <Text style={styles.successTitle}>Your vote has been cast!</Text>
        <Text style={styles.successSubtitle}>
          Thank you for participating in the election. Your vote has been successfully recorded.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(app)/voting' as any)}
        >
          <Text style={styles.primaryButtonText}>View Results</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(app)/voting' as any)}
        >
          <Text style={styles.secondaryButtonText}>Back to Voting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f6f7f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#617c89',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1193d4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#374151',
    letterSpacing: 0.5,
  },
});
