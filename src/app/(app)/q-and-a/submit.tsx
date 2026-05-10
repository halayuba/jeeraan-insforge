import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../contexts/ToastContext';
import { useSubmitQuestion } from '../../../hooks/useCommunityQuestions';

export default function QuestionSubmit() {
  const router = useRouter();
  const { neighborhoodId } = useAuthStore();
  const { showToast } = useToast();
  const [questionText, setQuestionText] = useState('');

  const { mutateAsync: submitQuestion, isPending: loading } = useSubmitQuestion();

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      showToast('Please enter your question.', 'error');
      return;
    }

    if (!neighborhoodId) {
      showToast('Neighborhood information not found.', 'error');
      return;
    }

    try {
      await submitQuestion(questionText);
      showToast('Question submitted successfully!', 'success');
      router.back();
    } catch (err: any) {
      console.error('Error submitting question:', err);
      showToast('Failed to submit question. Please try again.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Your Question</Text>
          <TextInput
            style={styles.input}
            placeholder="What would you like to ask your neighborhood admins?"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
            value={questionText}
            onChangeText={setQuestionText}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Your question will be sent privately to the neighborhood admins. They may choose to make it public if it's helpful for the whole community.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Submit Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={loading || !questionText.trim()}
          style={[styles.submitButton, (loading || !questionText.trim()) && styles.submitButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Question</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  label: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  input: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#1e293b',
    minHeight: 120,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  hint: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#1193d4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
});
