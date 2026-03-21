import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function ClassifiedsIndex() {
  const router = useRouter();
  const { refreshAuth, handleAuthError } = useAuth();
  const { showToast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAds();
    }, [])
  );

  const fetchAds = async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('classified_ads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      const formattedData = (data || []).map((ad: any) => ({
        ...ad,
        author: Array.isArray(ad.author) ? ad.author[0] : ad.author
      }));
      setAds(formattedData);
    } catch (err: any) {
      console.error('Error fetching classified ads:', err);
      handleAuthError(err);
      showToast('Failed to load ads.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAds(true);
  }, []);

  const filteredAds = ads.filter(
    (ad) =>
      ad.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classifieds</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(app)/classifieds/create' as any)}
          style={styles.iconButton}
        >
          <MaterialIcons name="add-circle" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1193d4']} />
        }
      >
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ads..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Ads List */}
        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredAds.length === 0 ? (
          <Text style={styles.emptyText}>No ads match your criteria.</Text>
        ) : (
          <View style={styles.adsList}>
            {filteredAds.map(ad => (
              <TouchableOpacity 
                key={ad.id} 
                style={styles.adCard}
                onPress={() => router.push(`/(app)/classifieds/${ad.id}` as any)}
              >
                <View style={styles.cardContent}>
                  
                  {/* Image Block */}
                  <View style={styles.imageBlock}>
                    {ad.image_url ? (
                      <Image source={{ uri: ad.image_url }} style={styles.adImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <MaterialIcons name="storefront" size={32} color="#94a3b8" />
                      </View>
                    )}
                    <Text style={styles.priceTag}>${ad.price}</Text>
                  </View>

                  {/* Details Block */}
                  <View style={styles.detailsBlock}>
                    <Text style={styles.adTitle} numberOfLines={2}>{ad.title}</Text>
                    <Text style={styles.adDescription} numberOfLines={2}>{ad.description}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.authorName}>by {ad.author?.full_name || 'Resident'}</Text>
                      <Text style={styles.contactInfo}>Contact: {ad.contact_info}</Text>
                    </View>
                  </View>
                  
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/(app)/classifieds/create' as any)}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.fabText}>Post Ad</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    paddingBottom: 100, // Make room for FAB
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  adsList: {
    gap: 16,
  },
  adCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  imageBlock: {
    alignItems: 'center',
    width: 96,
  },
  adImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  placeholderImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  adTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  adDescription: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    gap: 4,
  },
  authorName: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  contactInfo: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#1193d4',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    marginTop: 40,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 10,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1193d4',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
