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
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function QuestionSubmit() {
  const router = useRouter();
  const { user, neighborhoodId, handleAuthError } = useAuth();
  const { showToast } = useToast();
  const [questionText, setQuestionText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      showToast('Please enter your question.', 'error');
      return;
    }

    if (!neighborhoodId) {
      showToast('Neighborhood information not found.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Insert question into database
      const { data, error } = await insforge.database
        .from('questions')
        .insert({
          neighborhood_id: neighborhoodId,
          member_id: user?.id,
          question_text: questionText.trim(),
          is_public: false, // Default to private
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Trigger notification edge function (Async)
      insforge.functions.invoke('notify-new-question', {
        body: {
          questionId: data.id,
          neighborhoodId: neighborhoodId,
          memberName: user?.full_name || 'A neighbor',
          questionSnippet: questionText.trim().substring(0, 100),
        }
      }).catch(err => console.error('Error triggering notification:', err));

      showToast('Question submitted successfully!', 'success');
      router.back();
    } catch (err: any) {
      console.error('Error submitting question:', err);
      handleAuthError(err);
      showToast('Failed to submit question. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask a Question</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={loading || !questionText.trim()}
          style={styles.iconButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1193d4" />
          ) : (
            <Text style={[styles.submitText, !questionText.trim() && styles.disabledText]}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

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

        <View style={styles.infoCard}>
          <MaterialIcons name="security" size={20} color="#64748b" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Admins will be notified and will respond as soon as possible.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconButton: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
  },
  submitText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1193d4',
  },
  disabledText: {
    color: '#cbd5e1',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    borderColor: '#e2e8f0',
  },
  hint: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
});
