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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

const CATEGORIES = [
  'General',
  'Events',
  'Safety',
  'Pets',
  'Classifieds'
];

export default function CreateForumPost() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshAuth, handleAuthError } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Please complete the title and content fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get authenticated user
      const { data: userData, error: userErr } = await insforge.auth.getCurrentUser();
      
      if (userErr) throw userErr;
      if (!userData?.user) throw new Error('Not authenticated');

      // 2. Save Forum Post
      const { error } = await insforge.database
        .from('forum_posts')
        .insert([{
          title: title.trim(),
          content: content.trim(),
          category,
          user_id: userData.user.id,
        }]);

      if (error) throw error;
      
      showToast('Topic posted successfully.');
      router.replace('/forum');
    } catch (err: any) {
      console.error('Submit error:', err);
      
      handleAuthError(err);
      showToast(err.message || 'Failed to post topic.', 'error');
    } finally {
      setSubmitting(false);
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
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Category Picker (Scrolling Tabs) */}
        <View style={styles.categoryScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Topic Title"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        
        <TextInput
          style={styles.textArea}
          placeholder="What's on your mind? Start a neighborhood discussion..."
          placeholderTextColor="#94a3b8"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Sticky Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Post Topic</Text>
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
    borderBottomColor: 'rgba(17, 147, 212, 0.1)',
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
    padding: 16,
    gap: 16,
  },
  categoryScrollWrapper: {
    marginHorizontal: -16,
    paddingVertical: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#1193d4',
  },
  categoryText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#0f172a',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderRadius: 12,
    minHeight: 250,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  spacer: {
    height: 60,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#1193d4',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
