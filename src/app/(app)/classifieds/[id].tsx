import { ArrowLeft, MessageCircle, Share2, Tag, CheckCircle2, RotateCcw, AlertTriangle, Flag } from 'lucide-react-native';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { MemberName } from '../../../components/MemberName';
import { useToast } from '../../../contexts/ToastContext';
import { useClassifiedAd, useUpdateClassifiedAd } from '../../../hooks/useClassifieds';

const { width } = Dimensions.get('window');

export default function AdDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, neighborhoodId } = useAuthStore();
  const { showToast } = useToast();
  
  const { data: ad, isLoading: loading } = useClassifiedAd(id);
  const { mutateAsync: updateAd, isPending: updating } = useUpdateClassifiedAd();
  const reportMutation = useReportContent();

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      // If renewing, reset expiration
      if (newStatus === 'active' && ad.status === 'expired') {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        updateData.expires_at = newExpiry.toISOString();
      }

      await updateAd({ id: id as string, ...updateData });
      
      showToast(`Ad marked as ${newStatus}.`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update ad status.', 'error');
    }
  };

  const handleContactSeller = () => {
    if (!ad.author?.user_id) return;
    
    router.push({
      pathname: '/(app)/messages/[id]',
      params: { id: 'new', recipientId: ad.author.user_id }
    } as any);
  };

  const handleReportAd = () => {
    // Note: Alert.prompt is iOS only in React Native core, for cross-platform
    // we would use a custom modal, but Loma Vista West seems to prefer standard Alerts
    // for now. For simplicity, we use Alert.alert if prompt is not available.
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Report Ad',
        'Please describe why you are reporting this ad (e.g., scam, inappropriate content).',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Report', 
            onPress: async (reason) => submitReport(reason || 'No reason provided')
          }
        ]
      );
    } else {
      Alert.alert(
        'Report Ad',
        'Are you sure you want to report this ad for community review?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report', onPress: () => submitReport('Reported via Android') }
        ]
      );
    }
  };

  const submitReport = async (reason: string) => {
    await reportMutation.mutateAsync({
      entityId: id as string,
      entityType: 'classified_ad',
      reason
    });
  };

  if (loading && !ad) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ad not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user?.id === ad.user_id;

  const renderStatusBadge = () => {
    switch (ad.status) {
      case 'sold':
        return <View style={[styles.statusBadge, styles.statusSold]}><Text style={styles.statusText}>SOLD</Text></View>;
      case 'expired':
        return <View style={[styles.statusBadge, styles.statusExpired]}><Text style={styles.statusText}>EXPIRED</Text></View>;
      case 'pending_payment':
        return <View style={[styles.statusBadge, styles.statusPending]}><Text style={styles.statusText}>PENDING PAYMENT</Text></View>;
      case 'inactive':
        return <View style={[styles.statusBadge, styles.statusInactive]}><Text style={styles.statusText}>INACTIVE</Text></View>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {!isOwner && ad.status === 'active' && (
              <TouchableOpacity style={styles.iconButton} onPress={handleReportAd}>
                <Flag size={20} color="#ffffff" strokeWidth={2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconButton}>
              <Share2 size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Gallery */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {ad.image_url ? (
            <Image source={{ uri: ad.image_url }} style={styles.galleryImage} />
          ) : (
            <View style={styles.placeholderGallery}>
              <Tag size={64} color="#cbd5e1" strokeWidth={1.5} />
            </View>
          )}
        </ScrollView>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${ad.price}</Text>
              {renderStatusBadge()}
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{ad.category}</Text>
            </View>
          </View>

          <Text style={styles.title}>{ad.title}</Text>
          <Text style={styles.timestamp}>Posted on {new Date(ad.created_at).toLocaleDateString()}</Text>
          {ad.status === 'active' && ad.expires_at && (
            <Text style={styles.expiryDate}>Expires on {new Date(ad.expires_at).toLocaleDateString()}</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{ad.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerInfo}>
              {ad.author?.avatar_url && ad.author?.is_visible !== false ? (
                <Image source={{ uri: ad.author.avatar_url }} style={styles.sellerAvatar} />
              ) : (
                <View style={styles.sellerAvatarPlaceholder}>
                  <Text style={styles.sellerAvatarInitial}>
                    {ad.author?.is_visible !== false 
                      ? (ad.author?.full_name || 'U').charAt(0)
                      : '?'
                    }
                  </Text>
                </View>
              )}
              <View>
                <MemberName 
                  name={ad.author?.full_name} 
                  isVisible={ad.author?.is_visible} 
                  anonymousId={ad.author?.anonymous_id}
                  textStyle={styles.sellerName}
                />
                <Text style={styles.sellerMeta}>Verified Resident</Text>
              </View>
            </View>
          </View>

          {/* Owner Actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <Text style={styles.sectionTitle}>Manage Your Ad</Text>
              <View style={styles.actionButtons}>
                {ad.status === 'active' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.soldButton]} 
                    onPress={() => handleStatusUpdate('sold')}
                    disabled={updating}
                  >
                    <CheckCircle2 size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Mark as Sold</Text>
                  </TouchableOpacity>
                )}
                
                {ad.status === 'expired' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.renewButton]} 
                    onPress={() => handleStatusUpdate('active')}
                    disabled={updating}
                  >
                    <RotateCcw size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Renew (Free)</Text>
                  </TouchableOpacity>
                )}

                {ad.status !== 'inactive' && ad.status !== 'pending_payment' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deactivateButton]} 
                    onPress={() => handleStatusUpdate('inactive')}
                    disabled={updating}
                  >
                    <AlertTriangle size={18} color="#64748b" />
                    <Text style={[styles.actionButtonText, { color: '#64748b' }]}>Deactivate</Text>
                  </TouchableOpacity>
                )}

                {ad.status === 'inactive' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.renewButton]} 
                    onPress={() => handleStatusUpdate('active')}
                    disabled={updating}
                  >
                    <RotateCcw size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Reactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      {!isOwner && ad.status === 'active' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.messageButton} onPress={handleContactSeller}>
            <MessageCircle size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.messageButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7f8',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  imageGallery: {
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  galleryImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  placeholderGallery: {
    width: width,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: '#1193d4',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusSold: {
    backgroundColor: '#10b981',
  },
  statusExpired: {
    backgroundColor: '#ef4444',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
  },
  statusInactive: {
    backgroundColor: '#94a3b8',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 22,
    color: '#0f172a',
    marginBottom: 8,
  },
  timestamp: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
  },
  expiryDate: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  sellerCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#64748b',
  },
  sellerName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1e293b',
  },
  sellerMeta: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  ownerActions: {
    marginTop: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  soldButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  renewButton: {
    backgroundColor: '#1193d4',
    borderColor: '#1193d4',
  },
  deactivateButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    color: '#ffffff',
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 32,
  },
  messageButton: {
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  errorText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
});
