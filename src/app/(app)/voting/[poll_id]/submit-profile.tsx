import { Camera, X } from 'lucide-react-native';


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../../lib/insforge';
import { useAuth } from '../../../../contexts/AuthContext';

export default function SubmitProfileScreen() {
  const { poll_id } = useLocalSearchParams<{ poll_id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [bio, setBio] = useState('');
  const [assets, setAssets] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      if (data && data.is_visible === false) {
        Alert.alert(
          'Ineligible for Board',
          'Anonymous members are not eligible for board positions. Please make your profile visible in settings to continue.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async () => {
    if (!bio.trim() || !assets.trim()) {
      Alert.alert('Validation Error', 'Please fill out all fields.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await insforge.database.from('candidates').insert([{
        poll_id,
        user_id: session?.user?.id,
        bio: bio.trim(),
        assets: assets.trim(),
        image_url: profile?.avatar_url || null,
      }]);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'You have already submitted a profile for this election.');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Success', 'Profile submitted successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.error('Profile submission error:', err);
      Alert.alert('Error', 'Failed to submit profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoPlaceholder}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.photoImage} />
            ) : (
              <Camera size={40} color="#64748b" strokeWidth={2} />
            )}
          </View>
          <Text style={styles.photoLabel}>
            {profile?.avatar_url ? 'Existing Profile Picture' : 'No profile picture found'}
          </Text>
          {!profile?.avatar_url && (
            <TouchableOpacity onPress={() => router.push('/profile' as any)}>
              <Text style={styles.linkText}>Upload photo in Profile Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Biography</Text>
          <TextInput
            multiline
            style={styles.textArea}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#94a3b8"
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
          />
        </View>

        {/* Assets Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            What are your strongest assets and what would you hope to bring to the board and to the community?
          </Text>
          <TextInput
            multiline
            style={[styles.textArea, styles.textAreaTall]}
            placeholder="Your answer here..."
            placeholderTextColor="#94a3b8"
            value={assets}
            onChangeText={setAssets}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Profile'}
          </Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 100,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  photoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'Manrope-SemiBold',
    color: '#1193d4',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Manrope-SemiBold',
    color: '#0f172a',
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#0f172a',
    minHeight: 120,
  },
  textAreaTall: {
    minHeight: 160,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#1193d4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
});
