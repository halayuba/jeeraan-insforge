import { ArrowLeft, Camera, Info, Send, Shield, Trash2, Wrench, X } from 'lucide-react-native';

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { insforge } from '../../../lib/insforge';
import { uploadImage as uploadImageUtil } from '../../../lib/upload';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../contexts/ToastContext';
import { checkDailyLimit } from '../../../lib/rateLimit';
import { useCreateGrievance } from '../../../hooks/useGrievances';

const CATEGORIES = [
  { id: 'Maintenance', icon: Wrench },
  { id: 'Security', icon: Shield },
  { id: 'Cleaning', icon: Trash2 },
];

export default function SubmitGrievance() {
  const router = useRouter();
  const { neighborhoodId, user } = useAuthStore();
  const { showToast } = useToast();
  
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const { mutateAsync: createGrievance, isPending: submitting } = useCreateGrievance();

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
    // No permissions request is necessary for launching the image library
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

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const uploadImagesAndGetUrls = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    const imageUrls: string[] = [];
    const { user, neighborhoodId } = useAuthStore.getState();
    if (!user || !neighborhoodId) return [];
    
    for (const img of images) {
      try {
        const { url, error } = await uploadImageUtil(img.uri, {
          bucketName: 'grievance-images',
          userId: user.id,
          neighborhoodId: neighborhoodId,
          serviceType: 'grievance',
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
    if (!title.trim() || !description.trim()) {
      showToast('Please provide a title and description.', 'error');
      return;
    }

    if (!user) {
      showToast('You must be logged in to submit a grievance.', 'error');
      return;
    }

    try {
      const { allowed } = await checkDailyLimit('grievances', user.id);
      if (!allowed) {
        showToast('Daily limit reached. Please try again tomorrow.', 'error');
        return;
      }

      // 2. Upload images if any
      const uploadedImageUrls = await uploadImagesAndGetUrls();

      // 3. Insert record using mutation
      const newGrievance = await createGrievance({
        title: title.trim(),
        description: description.trim(),
        category,
        status: 'Pending',
        images: uploadedImageUrls,
      });

      // 4. Award Points
      try {
        const { data: rewardData } = await insforge.functions.invoke('award-points-v1', {
          body: {
            userId: user.id,
            actionType: 'grievance_submission',
            neighborhoodId: neighborhoodId,
            entityId: newGrievance.id
          }
        });
        handleGamificationReward(rewardData);
      } catch (rewardErr) {
        console.error('Failed to award grievance points:', rewardErr);
      }

      showToast('Grievance reported successfully!');
      router.push('/(app)/grievances');
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.message || 'Failed to submit grievance.', 'error');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Grievance</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Info size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
            {CATEGORIES.map((cat) => {
              const CategoryIcon = cat.icon;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[
                    styles.categoryChip,
                    category === cat.id && styles.categoryChipActive
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <CategoryIcon 
                    size={16} 
                    color={category === cat.id ? '#ffffff' : '#475569'} 
                    style={styles.categoryIcon}
                    strokeWidth={2}
                  />
                  <Text style={[
                    styles.categoryText,
                    category === cat.id ? styles.categoryTextActive : styles.categoryTextInactive
                  ]}>
                    {cat.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grievance Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Briefly name the issue"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Textarea */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide detailed information about your grievance so our team can help you better"
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Image Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Images</Text>
          <Text style={styles.sectionSubtitle}>Adding photos helps us resolve issues faster.</Text>
          
          <View style={styles.imagesGrid}>
            {/* Add New Button */}
            {images.length < 3 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Camera size={24} color="#94a3b8" strokeWidth={2} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
            
            {/* Selected Images Preview */}
            {images.map((img, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color="#ffffff" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        
        {/* Bottom Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Sticky Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Grievance</Text>
              <Send size={20} color="#ffffff" strokeWidth={2} />
            </>
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
    borderRadius: 20,
    backgroundColor: '#f8fafc',
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
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    marginTop: -4,
  },
  categoryContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1193d4',
  },
  categoryChipInactive: {
    backgroundColor: '#f1f5f9',
  },
  categoryIcon: {
    marginTop: 1,
  },
  categoryText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  categoryTextInactive: {
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    minHeight: 160,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  addImageBtn: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: '#94a3b8',
  },
  imagePreviewContainer: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    height: 80, // Space for bottom fixed bar
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitButton: {
    backgroundColor: '#1193d4',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 4px 8px rgba(17, 147, 212, 0.2)',
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
