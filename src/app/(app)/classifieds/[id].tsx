import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';

export default function ClassifiedAdDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAdDetail();
    }
  }, [id]);

  const fetchAdDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('classified_ads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const formattedAd = {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author
      };
      setAd(formattedAd);
    } catch (err) {
      console.error('Error fetching classified ad details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!ad) return;
    try {
      await Share.share({
        message: `Check out this classified ad on Jeeraan: ${ad.title} for $${ad.price}. Contact: ${ad.contact_info}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ad not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
          <MaterialIcons name="share" size={24} color="#1193d4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Section */}
        <View style={styles.imageSection}>
          {ad.image_url ? (
            <Image source={{ uri: ad.image_url }} style={styles.mainImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="storefront" size={80} color="#cbd5e1" />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Pricing & Title */}
        <View style={styles.infoCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>${ad.price}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>Classified</Text>
            </View>
          </View>
          <Text style={styles.adTitle}>{ad.title}</Text>
          <Text style={styles.dateText}>Posted on {new Date(ad.created_at).toLocaleDateString()}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{ad.description || 'No description provided.'}</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerRow}>
            <Image 
              source={{ uri: ad.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.author?.full_name || 'Resident')}&background=1193d4&color=fff` }} 
              style={styles.sellerAvatar} 
            />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{ad.author?.full_name || 'Resident'}</Text>
              <Text style={styles.sellerRole}>Neighborhood Member</Text>
            </View>
          </View>
          
          <View style={styles.contactCard}>
            <MaterialIcons name="contact-phone" size={20} color="#1193d4" />
            <Text style={styles.contactInfo}>{ad.contact_info}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactButton} onPress={() => {}}>
          <MaterialIcons name="chat" size={20} color="#ffffff" />
          <Text style={styles.contactButtonText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  backLink: {
    padding: 10,
  },
  backLinkText: {
    color: '#1193d4',
    fontFamily: 'Manrope-Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
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
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageSection: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontFamily: 'Manrope-Medium',
    color: '#cbd5e1',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 28,
    color: '#1193d4',
  },
  categoryBadge: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    textTransform: 'uppercase',
  },
  adTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  sellerRole: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactInfo: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  contactButton: {
    backgroundColor: '#1193d4',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
