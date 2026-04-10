import { ArrowLeft, Check } from 'lucide-react-native';


import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { checkDailyLimit, validateInvite } from '../../../lib/rateLimit';

export default function InviteRequestForm() {
  const router = useRouter();
  const { neighborhoodId, session, refreshAuth, handleAuthError } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Please complete the name and phone number fields.');
      return;
    }

    if (!attested) {
      Alert.alert('Attestation Required', 'Please confirm that the invitee lives in your neighborhood.');
      return;
    }

    if (!neighborhoodId) {
      Alert.alert('Error', 'Neighborhood context missing. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      // NEW: Check daily limit for invites (5/day)
      if (session?.user?.id) {
        const { allowed } = await checkDailyLimit('join_requests', session.user.id);
        if (!allowed) {
          showToast('You have reached your limit for the day. You can submit again on a future day.', 'error');
          return;
        }
      }

      // NEW: Validate phone number uniqueness across members/requests/invites
      const { allowed: phoneAllowed, message: phoneMessage } = await validateInvite(phone.trim());
      if (!phoneAllowed) {
        Alert.alert('Validation Error', phoneMessage);
        return;
      }

      const { error } = await insforge.database
        .from('join_requests')
        .insert([{
          neighborhood_id: neighborhoodId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          status: 'pending',
          created_by: session?.user?.id
        }]);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      showToast('Invite request submitted successfully.', 'success');
      router.back();
    } catch (err: any) {
      console.error('Submit error:', err);
      handleAuthError(err);
      Alert.alert('Error', err.message || 'Failed to submit invite request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite a Neighbor</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.formTitle}>Invite a friend from your neighborhood to join</Text>
        <Text style={styles.formSubtitle}>Submit a request to the neighborhood board to verify and invite your neighbor.</Text>
        
        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 000-0000"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address <Text style={styles.optional}>(Optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="neighbor@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAttested(!attested)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, attested && styles.checkboxChecked]}>
              {attested && <Check size={16} color="#fff" strokeWidth={2} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I attest that the person this invite is intended for is currently living in my neighborhood
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  formTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 32,
  },
  formSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
    lineHeight: 20,
  },
  formGroup: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#0f172a',
  },
  optional: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  input: {
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1193d4',
    borderColor: '#1193d4',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  spacer: {
    height: 60,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    height: 56,
    backgroundColor: '#1193d4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
