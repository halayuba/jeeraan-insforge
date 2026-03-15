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
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { insforge } from '../../../lib/insforge';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { refreshAuth } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const uploadImagesAndGetUrls = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    const imageUrls: string[] = [];
    
    for (const img of images) {
      try {
        const ext = img.uri.split('.').pop() || 'jpg';
        const fileKey = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        // Fetch the file and create a blob to seamlessly upload to InsForge
        const fileResponse = await fetch(img.uri);
        const blob = await fileResponse.blob();

        const { error: uploadError } = await insforge.storage
          .from('announcement-media')
          .upload(fileKey, blob);
          
        if (uploadError) throw uploadError;
        
        const publicUrlData = insforge.storage
          .from('announcement-media')
          .getPublicUrl(fileKey);
          
        imageUrls.push(publicUrlData as unknown as string);
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

      // 2. Upload array of attached images (if any)
      const uploadedImageUrls = await uploadImagesAndGetUrls();

      // 3. Save Announcement DB Record
      const { error } = await insforge.database
        .from('announcements')
        .insert([{
          title: title.trim(),
          content: content.trim(),
          category,
          images: uploadedImageUrls,
          author_id: userData.user.id,
        }]);

      if (error) throw error;
      
      showToast('Announcement posted successfully.', 'success');
      router.back();
    } catch (err: any) {
      console.error('Submit error:', err);
      
      // Handle JWT expired/session issues specifically
      if (err.message?.includes('JWT expired') || err.code === 'PGRST301' || err.statusCode === 401) {
        showToast('Your session has expired. Please sign in again.', 'error');
        // Refresh auth state which will likely trigger the global redirect in (app)/_layout.tsx
        refreshAuth();
        return;
      }
      
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
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
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
            <MaterialIcons name="image" size={20} color="#0f172a" />
          </View>
          <Text style={styles.attachmentText}>Add Images</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.attachmentButton}>
          <View style={styles.attachmentIconContainer}>
            <MaterialIcons name="attach-file" size={20} color="#0f172a" />
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
                  <MaterialIcons name="close" size={14} color="#ffffff" />
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
