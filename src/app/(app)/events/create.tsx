import { ArrowLeft } from 'lucide-react-native';


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
import { useToast } from '../../../contexts/ToastContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { checkDailyLimit } from '../../../lib/rateLimit';

import { useCreateEvent } from '../../../hooks/useEvents';

export default function CreateEvent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { handleAuthError, user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [venue, setVenue] = useState('');
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Upcoming');
  
  const { createEvent, isCreating: submitting } = useCreateEvent();

  const handleSubmit = async () => {
    if (!title.trim() || !details.trim() || !organizer.trim() || !venue.trim() || !datetime.trim()) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      if (!user) throw new Error('Not authenticated');

      const { allowed } = await checkDailyLimit('events', user.id);
      if (!allowed) {
        showToast('You have reached your limit for the day. You can submit again on a future day.', 'error');
        return;
      }

      await createEvent({
        title,
        details,
        organizer,
        venue,
        datetime,
        status,
        notes: notes.trim() || undefined,
        userId: user.id
      });
      
      showToast('Event created successfully.', 'success');
      router.back();
    } catch (err: any) {
      console.error('Submit error:', err);
      handleAuthError(err);
      Alert.alert('Error', err.message || 'Failed to create event. Make sure the date format is valid (e.g. 2024-08-10 14:00)');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Event</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Summer BBQ Party"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Details</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the event..."
            placeholderTextColor="#94a3b8"
            value={details}
            onChangeText={setDetails}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Organizer</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Jane Doe"
            placeholderTextColor="#94a3b8"
            value={organizer}
            onChangeText={setOrganizer}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Community Clubhouse"
            placeholderTextColor="#94a3b8"
            value={venue}
            onChangeText={setVenue}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date/Time</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD HH:MM AM"
            placeholderTextColor="#94a3b8"
            value={datetime}
            onChangeText={setDatetime}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {['Upcoming', 'Past', 'Ongoing'].map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.statusChip, status === s && styles.statusChipActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes <Text style={styles.optional}>(Optional)</Text></Text>
          <TextInput
            style={styles.textAreaSmall}
            placeholder="Any additional information..."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Event</Text>
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
    backgroundColor: '#ffffff',
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
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
  },
  optional: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  input: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  textAreaSmall: {
    minHeight: 80,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  statusChipActive: {
    backgroundColor: '#1193d4',
  },
  statusText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#475569',
  },
  statusTextActive: {
    color: '#ffffff',
  },
  spacer: {
    height: 60,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(17, 147, 212, 0.2)',
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
