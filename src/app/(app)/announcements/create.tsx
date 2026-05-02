import { ArrowLeft, Image as ImageIcon, Paperclip, X } from 'lucide-react-native';


import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { insforge } from '../../../lib/insforge';
import { uploadImage as uploadImageUtil } from '../../../lib/upload';
import { useToast } from '../../../contexts/ToastContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { checkDailyLimit } from '../../../lib/rateLimit';
import { useCreateAnnouncement } from '../../../hooks/useAnnouncements';

const CATEGORIES = [
  'General Info',
  'Safety',
  'Security',
  'Events',
  'Maintenance'
];

export default function CreateAnnouncement() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshAuth, handleAuthError, neighborhoodId, userRole } = useAuthStore();
  const { mutateAsync: createAnnouncement } = useCreateAnnouncement();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleGamificationReward = (rewardData: any) => {
    if (rewardData?.success && rewardData.points_added > 0) {
      let message = `You earned ${rewardData.points_added} points!`;
      if (rewardData.level_up) {
        message += ` 🎉 You reached Level ${rewardData.new_level}!`;
      } else if (rewardData.eligible_for_moderator) {
        message += ` 🎖️ You are now eligible for Moderator role!`;
      }
      showToast(message, 'success');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0]]);
    }
    };

    const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    };

    const uploadImagesAndGetUrls = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const imageUrls: string[] = [];
    const { user, neighborhoodId } = useAuthStore.getState();
    if (!user || !neighborhoodId) return [];

    for (const img of images) {
      try {
        const { url, error } = await uploadImageUtil(img.uri, {
          bucketName: 'announcement-media',
          userId: user.id,
          neighborhoodId: neighborhoodId,
          serviceType: 'announcement',
          maxLimit: 10,
          base64: img.base64 || undefined
        });
        if (error) {
          showToast(error, 'error');
          continue;
        }
        imageUrls.push(url);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }
    
    return imageUrls;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please complete the title and content fields.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get authenticated user
      const { data: userData, error: authError } = await insforge.auth.getCurrentUser();
      if (authError) throw authError;
      if (!userData?.user) throw new Error('Not authenticated');

      // NEW: Check daily limit
      const { allowed } = await checkDailyLimit('announcements', userData.user.id);
      if (!allowed) {
        showToast('You have reached your limit for the day. You can submit again on a future day.', 'error');
        return;
      }

      // 2. Upload array of attached images (if any)
      const uploadedImageUrls = await uploadImagesAndGetUrls();

      // 3. Save Announcement DB Record
      const isPrivileged = userRole === 'admin' || userRole === 'moderator';
      const status = isPrivileged ? 'approved' : 'pending';

      const newAnnouncement = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category,
        images: uploadedImageUrls,
        author_id: userData.user.id,
        status,
      });

      // 4. Award Points
      try {
        const { data: rewardData } = await insforge.functions.invoke('award-points-v1', {
          body: {
            userId: userData.user.id,
            actionType: 'announcement',
            neighborhoodId: neighborhoodId,
            entityId: newAnnouncement.id
          }
        });
        handleGamificationReward(rewardData);
      } catch (rewardErr) {
        console.error('Failed to award points:', rewardErr);
        // Don't fail the whole process if gamification fails
      }

      if (status === 'pending') {
        showToast('This enighborhood admins are reviewing your announcement and it will be posted when approved', 'info');
      } else {
        showToast('Announcement posted successfully.', 'success');
      }
      router.back();
    } catch (err: any) {
      console.error('Submit error:', err);
      
      // Handle JWT expired/session issues specifically
      handleAuthError(err);
      
      Alert.alert('Error', err.message || 'Failed to post announcement.');
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
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Announcement</Text>
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
          placeholder="Title"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        
        <TextInput
          style={styles.textArea}
          placeholder="Write your announcement here..."
          placeholderTextColor="#94a3b8"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Static Attachments UI */}
        <Text style={styles.sectionTitle}>Attachments</Text>
        
        <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
          <View style={styles.attachmentIconContainer}>
            <ImageIcon size={20} color="#0f172a" strokeWidth={2} />
          </View>
          <Text style={styles.attachmentText}>Add Images</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.attachmentButton}>
          <View style={styles.attachmentIconContainer}>
            <Paperclip size={20} color="#0f172a" strokeWidth={2} />
          </View>
          <Text style={styles.attachmentText}>Add Files</Text>
        </TouchableOpacity>

        {/* Previews */}
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <X size={14} color="#ffffff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
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
            <Text style={styles.submitButtonText}>Post Announcement</Text>
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
  },
  categoryChipActive: {
    backgroundColor: '#1193d4',
  },
  categoryText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderRadius: 12,
    minHeight: 200,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginTop: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 16,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imagePreviewContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
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
    boxShadow: '0px 4px 8px rgba(17, 147, 212, 0.3)',
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
