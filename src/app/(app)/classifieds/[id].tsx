import { ArrowLeft, MessageCircle, Share2, Tag } from 'lucide-react-native';


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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { MemberName } from '../../../components/MemberName';

const { width } = Dimensions.get('window');

export default function AdDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { handleAuthError } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdDetail();
  }, [id]);

  const fetchAdDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('classified_ads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
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
      console.error('Error fetching ad details:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Share2 size={24} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Gallery */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
          {ad.images && ad.images.length > 0 ? (
            ad.images.map((img: string, idx: number) => (
              <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
            ))
          ) : (
            <View style={styles.placeholderGallery}>
              <Tag size={64} color="#cbd5e1" strokeWidth={1.5} />
            </View>
          )}
        </ScrollView>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${ad.price}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{ad.category}</Text>
            </View>
          </View>

          <Text style={styles.title}>{ad.title}</Text>
          <Text style={styles.timestamp}>Posted on {new Date(ad.created_at).toLocaleDateString()}</Text>

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
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.messageButton}>
          <MessageCircle size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.messageButtonText}>Contact Seller</Text>
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
    paddingBottom: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: '#1193d4',
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
