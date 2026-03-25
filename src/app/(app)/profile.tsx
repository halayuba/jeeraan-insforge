import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { insforge } from '../../lib/insforge';
import { useToast } from '../../contexts/ToastContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Editable fields state
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [language, setLanguage] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setGender(data.gender || '');
        setEmail(data.email || '');
        setBirthday(data.birthday || '');
        setLanguage(data.language || '');
        setWorkTitle(data.work_title || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setSaving(true);
    try {
      const ext = uri.split('.').pop();
      const fileName = `${session?.user?.id}-${Date.now()}.${ext}`;
      
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();

      const { error: uploadError } = await insforge.storage
        .from('avatars')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const publicUrlData = insforge.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrlData as unknown as string;
      
      // Update profile with new avatar URL
      const { error: updateError } = await insforge.database
        .from('user_profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', session?.user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      showToast('Profile picture updated');
    } catch (err) {
      console.error('Error uploading image:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await insforge.database
        .from('user_profiles')
        .update({
          gender,
          email,
          birthday: birthday || null,
          language,
          work_title: workTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session?.user?.id);

      if (error) throw error;
      showToast('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInactivate = () => {
    Alert.alert(
      'Inactivate Account',
      'Are you sure you want to temporarily inactivate your account? You can reactivate it later by signing back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Inactivate', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await insforge.database
                .from('user_profiles')
                .update({ is_active: false })
                .eq('user_id', session?.user?.id);
              if (error) throw error;
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (err) {
              showToast('Action failed', 'error');
            }
          }
        }
      ]
    );
  };

  const handleDeleteRequest = () => {
    Alert.alert(
      'Delete Profile',
      'This will send a request to the neighborhood admin to remove you from the community. Your account will be permanently deleted once processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Removal', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await insforge.database
                .from('user_profiles')
                .update({ deletion_requested: true })
                .eq('user_id', session?.user?.id);
              if (error) throw error;
              showToast('Removal request sent to admin');
            } catch (err) {
              showToast('Action failed', 'error');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal info</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#1193d4" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Profile Picture */}
          <TouchableOpacity style={styles.row} onPress={handlePickImage}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="camera-alt" size={22} color="#64748b" />
              <Text style={styles.label}>Profile picture</Text>
            </View>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{profile?.full_name?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Name - Read Only */}
          <View style={[styles.row, styles.disabledRow]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="account-box" size={22} color="#94a3b8" />
              <View>
                <Text style={[styles.label, styles.disabledLabel]}>Name</Text>
                <Text style={styles.value}>{profile?.full_name}</Text>
              </View>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="person" size={22} color="#64748b" />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="Not specified"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>

          {/* Email */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="email" size={22} color="#64748b" />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Add email address"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>

          {/* Phone - Read Only */}
          <View style={[styles.row, styles.disabledRow]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="phone" size={22} color="#94a3b8" />
              <View>
                <Text style={[styles.label, styles.disabledLabel]}>Phone</Text>
                <Text style={styles.value}>{profile?.phone}</Text>
              </View>
            </View>
          </View>

          {/* Birthday */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="cake" size={22} color="#64748b" />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Birthday</Text>
                <TextInput
                  style={styles.input}
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>

          {/* Language */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="language" size={22} color="#64748b" />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Language</Text>
                <TextInput
                  style={styles.input}
                  value={language}
                  onChangeText={setLanguage}
                  placeholder="e.g. English (US)"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>

          {/* Home Address - Read Only */}
          <View style={[styles.row, styles.disabledRow]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="home" size={22} color="#94a3b8" />
              <View>
                <Text style={[styles.label, styles.disabledLabel]}>Home address</Text>
                <Text style={styles.value}>{profile?.address || 'Verified neighborhood address'}</Text>
              </View>
            </View>
          </View>

          {/* Work and Job Title */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="work" size={22} color="#64748b" />
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Work address / Job Title</Text>
                <TextInput
                  style={styles.input}
                  value={workTitle}
                  onChangeText={setWorkTitle}
                  placeholder="Add your profession or workplace"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>
        </View>

        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity style={styles.managementButton} onPress={handleInactivate}>
            <MaterialIcons name="pause-circle-filled" size={24} color="#f59e0b" />
            <Text style={styles.managementButtonText}>Temporarily Inactivate Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.managementButton, styles.deleteButton]} onPress={handleDeleteRequest}>
            <MaterialIcons name="delete-forever" size={24} color="#ef4444" />
            <Text style={[styles.managementButtonText, styles.deleteButtonText]}>Request Removal / Delete Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#1e293b',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  disabledRow: {
    backgroundColor: '#fcfcfc',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Manrope-Bold',
    color: '#64748b',
    marginBottom: 2,
  },
  disabledLabel: {
    color: '#94a3b8',
  },
  value: {
    fontSize: 15,
    fontFamily: 'Manrope-Medium',
    color: '#475569',
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Manrope-Medium',
    color: '#1e293b',
    padding: 0,
    height: 20,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
  },
  managementSection: {
    gap: 12,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#475569',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  managementButtonText: {
    fontSize: 15,
    fontFamily: 'Manrope-SemiBold',
    color: '#f59e0b',
  },
  deleteButton: {
    borderColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  signOutButton: {
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#64748b',
  },
});
