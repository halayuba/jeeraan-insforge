import { ChevronLeft, Layout } from 'lucide-react-native';


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { insforge } from '../../lib/insforge';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');
const AD_WIDTH = 300;
const AD_HEIGHT = 600;

export default function AdvertisementsIndex() {
  const router = useRouter();
  const { neighborhoodId, handleAuthError } = useAuthStore();
  const { showToast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAds();
    }, [neighborhoodId])
  );

  useEffect(() => {
    // Auto-rotation disabled as per issue_Apr22-4
    /*
    if (ads.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % ads.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      }, 5000); // Rotate every 5 seconds
      return () => clearInterval(interval);
    }
    */
  }, [ads, currentIndex]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      let query = insforge.database
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAds(data || []);
    } catch (err: any) {
      console.error('Error fetching ads:', err);
      // Don't call handleAuthError for 401s if we're in a public route
      const is401 = err.code === 'PGRST301' || err.statusCode === 401 || err.message?.includes('JWT expired');
      if (neighborhoodId || !is401) {
        handleAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdPress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open URL:', err);
        showToast('Could not open the link.', 'error');
      });
    }
  };

  const renderAd = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => handleAdPress(item.website_url)}
      style={styles.adContainer}
    >
      <View style={styles.adCard}>
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.adImage}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Launch Notification */}
      <View style={styles.notificationBar}>
        <Text style={styles.notificationText}>
          Celebrating Our Launch — Enjoy 30 Days of Free Advertising - Reach the community at no cost.
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ChevronLeft size={20} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Ads</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introSection}>
          <Text style={styles.sectionTitle}>Support Local Businesses</Text>
          <Text style={styles.sectionSubtitle}>Exclusive offers from our neighborhood partners</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 100 }} />
        ) : ads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layout size={64} color="#e2e8f0" strokeWidth={2} />
            <Text style={styles.emptyText}>No advertisements available.</Text>
            <Text style={styles.emptySubtext}>Check back later for local offers!</Text>
          </View>
        ) : (
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={flatListRef}
              data={ads}
              renderItem={renderAd}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentIndex(index);
              }}
              style={styles.flatList}
            />
            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {ads.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    currentIndex === index && styles.activeDot
                  ]} 
                />
              ))}
            </View>
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
  notificationBar: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17, 147, 212, 0.2)',
  },
  notificationText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: '#1193d4',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#f6f7f8',
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  carouselWrapper: {
    width: width,
    height: AD_HEIGHT + 40,
    alignItems: 'center',
  },
  flatList: {
    width: width,
  },
  adContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adCard: {
    width: AD_WIDTH,
    height: AD_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  businessName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  industryText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  activeDot: {
    backgroundColor: '#1193d4',
    width: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
