import { ArrowLeft, CloudUpload, Info, CheckCircle2 } from 'lucide-react-native';

import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { useStripe } from '../../../lib/stripe';

import { insforge } from '../../../lib/insforge';
import { useToast } from '../../../contexts/ToastContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { checkDailyLimit } from '../../../lib/rateLimit';
import { calculateListingFee, getListingLimit } from '../../../lib/classifieds';
import { useCreateClassifiedAd } from '../../../hooks/useClassifieds';
import { useNeighborhoodSettings } from '../../../hooks/useNeighborhoodSettings';

export default function CreateClassifiedAd() {
  const router = useRouter();
  const { showToast } = useToast();
  const { handleAuthError, neighborhoodId, userRole, user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { settings, isLoading: loadingSettings } = useNeighborhoodSettings(neighborhoodId);
  const { createAd, isCreating: submitting } = useCreateClassifiedAd(neighborhoodId);

  const monetizationEnabled = settings?.classifieds_monetization_enabled ?? false;
  const [fee, setFee] = useState(0);

  useEffect(() => {
    if (monetizationEnabled) {
      const p = parseFloat(price) || 0;
      setFee(calculateListingFee(p));
    } else {
      setFee(0);
    }
  }, [price, monetizationEnabled]);

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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (err) {
      console.error('Image picking failed:', err);
      showToast('Failed to pick image.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price.trim() || !contactInfo.trim()) {
      showToast('Please complete title, price, and contact info.', 'error');
      return;
    }

    if (!termsAccepted) {
      showToast('You must accept the terms and conditions.', 'error');
      return;
    }

    try {
      if (!user) throw new Error('Not authenticated');

      const { allowed } = await checkDailyLimit('classified_ads', user.id);
      if (!allowed) {
        showToast('You have reached your limit for the day.', 'error');
        return;
      }

      await createAd({
        title,
        price,
        description,
        contactInfo,
        imageUri,
        imageBase64: imageBase64 || undefined,
        fee,
        user,
        initPaymentSheet,
        presentPaymentSheet,
        onReward: handleGamificationReward
      });

      router.back();
    } catch (err: any) {
      console.error('Submit error:', err);
      handleAuthError(err);
      showToast(err.message || 'Failed to post ad.', 'error');
    }
  };

  if (loadingSettings) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Ad</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ad Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Gently Used Sofa"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          
          {monetizationEnabled && (
            <View style={[styles.feeBanner, fee > 0 ? styles.feeBannerPaid : styles.feeBannerFree]}>
              <Info size={16} color={fee > 0 ? '#1e40af' : '#166534'} />
              <Text style={[styles.feeText, fee > 0 ? styles.feeTextPaid : styles.feeTextFree]}>
                {fee > 0 ? `Listing Fee: $${fee.toFixed(2)}` : 'Listing is Free!'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add more details about your item..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contact Information</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., John D. - 555-1234"
            placeholderTextColor="#94a3b8"
            value={contactInfo}
            onChangeText={setContactInfo}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Upload Image <Text style={styles.optional}>(Optional)</Text></Text>
          <TouchableOpacity style={styles.imagePickerNode} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <CloudUpload size={48} color="#94a3b8" strokeWidth={2} />
                <Text style={styles.imagePickerText}>Tap to pick an image</Text>
                <Text style={styles.imagePickerSubtext}>PNG, JPG</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity 
          style={styles.termsContainer}
          onPress={() => setTermsAccepted(!termsAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <CheckCircle2 size={16} color="#ffffff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text>. I understand that listing fees (if any) are non-refundable.
          </Text>
        </TouchableOpacity>

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
            <Text style={styles.submitButtonText}>
              {fee > 0 ? `Pay $${fee.toFixed(2)} & Post` : 'Post Ad'}
            </Text>
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
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
  },
  currencySymbol: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  feeBannerPaid: {
    backgroundColor: '#eff6ff',
  },
  feeBannerFree: {
    backgroundColor: '#f0fdf4',
  },
  feeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
  },
  feeTextPaid: {
    color: '#1e40af',
  },
  feeTextFree: {
    color: '#166534',
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
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
    color: '#94a3b8',
    marginTop: -4,
  },
  imagePickerNode: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  imagePickerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 8,
  },
  imagePickerSubtext: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  termsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1193d4',
  },
  termsText: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  termsLink: {
    color: '#1193d4',
    fontFamily: 'Manrope-SemiBold',
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
