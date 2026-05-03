import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { IconPhotoPlus, IconCheck, IconSquare, IconSquareCheckFilled } from '@tabler/icons-react-native';

export default function GalleryUploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!user) return;
    if (!image || !image.base64) {
      Alert.alert('Missing Image', 'Please select a picture to upload.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Description Too Short', 'Please provide a description of at least 10 characters.');
      return;
    }
    if (!agreedToPolicy) {
      Alert.alert('Policy Agreement', 'You must agree to the gallery policy before posting.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to storage
      const fileExt = image.uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await insforge.storage
        .from('gallery')
        .upload(fileName, decode(image.base64), { 
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
        });

      if (uploadError) throw uploadError;

      // 2. Insert record
      const { data: post, error: insertError } = await insforge.database
        .from('gallery_posts')
        .insert({
          user_id: user.id,
          image_url: fileName,
          storage_key: fileName,
          description: description.trim(),
          status: 'pending' // will be updated by AI
        })
        .select()
        .single();

      if (insertError) {
        // If unique constraint violation
        if (insertError.code === '23505') {
          throw new Error('You can only post one picture per day.');
        }
        throw insertError;
      }

      // 3. Trigger AI validation asynchronously (fire and forget)
      insforge.functions.invoke('validate-gallery-post', {
        body: { postId: post.id }
      }).catch(err => console.error('AI validation error:', err));

      Alert.alert(
        'Upload Successful',
        'Your picture has been uploaded and is pending AI policy validation. It will appear in the gallery shortly if approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload picture.');
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <IconPhotoPlus size={48} color="#cbd5e1" />
            <Text style={styles.placeholderText}>Tap to select a picture</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (Min. 10 chars)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Where did you see this? What's interesting about it?"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#94a3b8"
        />
        <Text style={styles.charCount}>
          {description.length} / 300 characters
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => setAgreedToPolicy(!agreedToPolicy)}
        activeOpacity={0.7}
      >
        {agreedToPolicy ? (
          <IconSquareCheckFilled size={24} color="#1193d4" />
        ) : (
          <IconSquare size={24} color="#94a3b8" />
        )}
        <Text style={styles.checkboxLabel}>
          I confirm that this picture contains no human faces, individuals, or selfies, as per the community policy.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.submitButton, 
          (!image || description.length < 10 || !agreedToPolicy || uploading) && styles.submitButtonDisabled
        ]}
        onPress={handleUpload}
        disabled={!image || description.length < 10 || !agreedToPolicy || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <IconCheck size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>Submit Picture</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    marginTop: 12,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  checkboxLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
    flex: 1,
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
});
