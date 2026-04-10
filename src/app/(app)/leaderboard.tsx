import { ArrowLeft, Trophy, Medal, Search } from 'lucide-react-native';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { insforge } from '../../lib/insforge';
import { useAuth } from '../../contexts/AuthContext';
import { LevelBadge } from '../../components/LevelBadge';

export default function Leaderboard() {
  const router = useRouter();
  const { neighborhoodId, handleAuthError } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async (isRefreshing = false) => {
    if (!neighborhoodId) return;
    
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          profiles:user_id (
            full_name,
            avatar_url,
            points,
            level
          )
        `)
        .eq('neighborhood_id', neighborhoodId);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      const formattedData = (data || [])
        .map((item: any) => ({
          user_id: item.user_id,
          ...(Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)
        }))
        .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      
      setMembers(formattedData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [neighborhoodId])
  );

  const filteredMembers = members.filter(member => {
    const fullName = member.full_name || 'Unknown Member';
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={24} color="#eab308" strokeWidth={2} />;
    if (index === 1) return <Medal size={24} color="#94a3b8" strokeWidth={2} />;
    if (index === 2) return <Medal size={24} color="#cd7f32" strokeWidth={2} />;
    return <Text style={styles.rankText}>{index + 1}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Neighbors</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaderboard(true)} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search neighbors..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No neighbors found.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredMembers.map((member, index) => (
              <View key={member.user_id} style={[styles.item, index < 3 && styles.topItem]}>
                <View style={styles.rankContainer}>
                  {renderRankIcon(index)}
                </View>
                
                <Image 
                  source={{ uri: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || 'U')}&background=1193d4&color=fff` }} 
                  style={styles.avatar} 
                />
                
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{member.full_name || 'Resident'}</Text>
                    <LevelBadge level={member.level || 1} />
                  </View>
                  <Text style={styles.points}>{member.points || 0} Points</Text>
                </View>
              </View>
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
    backgroundColor: '#f8fafc',
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  list: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 16,
  },
  topItem: {
    backgroundColor: '#f8fafc',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#64748b',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#0f172a',
    maxWidth: '70%',
  },
  points: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: '#1193d4',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
  },
});
