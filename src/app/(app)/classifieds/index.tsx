import { ArrowLeft, PlusCircle, Search, Tag } from 'lucide-react-native';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { MemberName } from '../../../components/MemberName';

export default function ClassifiedsIndex() {
  const router = useRouter();
  const { handleAuthError, neighborhoodId, user } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAds();
  }, [neighborhoodId]);

  const fetchAds = async () => {
    if (!neighborhoodId) return;
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('classified_ads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((ad: any) => ({
        ...ad,
        author: Array.isArray(ad.author) ? ad.author[0] : ad.author
      }));

      // Filter: Show all active/sold ads, but only show pending/inactive to the owner
      const visibleAds = formattedData.filter((ad: any) => 
        ad.status === 'active' || 
        ad.status === 'sold' || 
        ad.user_id === user?.id
      );

      setAds(visibleAds);
    } catch (err) {
      console.error('Error fetching ads:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = ads.filter(ad => 
    (ad.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ad.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classified Ads</Text>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/(app)/classifieds/create' as any)}
        >
          <PlusCircle size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={24} color="#64748b" style={styles.searchIcon} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items for sale"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredAds.length === 0 ? (
          <Text style={styles.emptyText}>No ads found.</Text>
        ) : (
          <View style={styles.grid}>
            {filteredAds.map((ad) => (
              <TouchableOpacity 
                key={ad.id} 
                style={styles.adCard}
                onPress={() => router.push(`/(app)/classifieds/${ad.id}` as any)}
              >
                <View style={styles.imageContainer}>
                  {ad.image_url ? (
                    <Image source={{ uri: ad.image_url }} style={styles.adImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Tag size={32} color="#94a3b8" strokeWidth={1.5} />
                    </View>
                  )}
                  
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>${ad.price}</Text>
                  </View>

                  {/* Status Overlay for non-active ads */}
                  {ad.status !== 'active' && (
                    <View style={[styles.cardStatusBadge, 
                      ad.status === 'sold' ? styles.statusSold : 
                      ad.status === 'expired' ? styles.statusExpired : 
                      ad.status === 'pending_payment' ? styles.statusPending :
                      styles.statusInactive
                    ]}>
                      <Text style={styles.statusText}>{ad.status?.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.adContent}>
                  <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
                  <View style={styles.authorRow}>
                    <Text style={styles.authorName}>by </Text>
                    <MemberName 
                      name={ad.author?.full_name} 
                      isVisible={ad.author?.is_visible} 
                      anonymousId={ad.author?.anonymous_id}
                      textStyle={styles.authorName}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    padding: 16,
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  adCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(17, 147, 212, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 2,
  },
  priceText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
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
    fontSize: 8,
    fontFamily: 'Manrope-Bold',
  },
  adContent: {
    padding: 12,
  },
  adTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});
