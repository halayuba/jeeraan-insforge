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
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

type Member = {
  user_id: string;
  role: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    global_role?: string;
  };
};

export default function MembersIndex() {
  const router = useRouter();
  const { neighborhoodId, refreshAuth, handleAuthError } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');

  const fetchMembers = async (isRefreshing = false) => {
    if (!neighborhoodId) return;
    
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          profiles:user_id (
            full_name,
            avatar_url,
            global_role
          )
        `)
        .eq('neighborhood_id', neighborhoodId);

      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      // Ensure profiles is not an array and filter out admins
      const formattedData = (data || [])
        .map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        }))
        .filter((member: any) => 
          member.role !== 'admin' && 
          member.role !== 'super_admin' && 
          member.profiles?.global_role !== 'super_admin'
        );
      
      setMembers(formattedData);
    } catch (err) {
      console.error('Error fetching members:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [neighborhoodId])
  );

  const filteredMembers = members.filter(member => {
    const fullName = member.profiles?.full_name || 'Unknown Member';
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Mock online status for now since we don't have a real-time presence system yet
  const onlineMembersCount = Math.floor(members.length * 0.3); // Mock 30% online

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="search" size={24} color="#1193d4" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchMembers(true)} />
        }
      >
        {/* Invite Button */}
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={() => router.push('/(app)/invites/request' as any)}
        >
          <MaterialIcons name="person-add" size={20} color="#ffffff" />
          <Text style={styles.inviteButtonText}>Request Invite for a Neighbor</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Neighbors</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'online' && styles.activeTab]}
            onPress={() => setActiveTab('online')}
          >
            <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
              Online ({onlineMembersCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Members List */}
        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No neighbors found.</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {filteredMembers.map((member, index) => {
              const fullName = member.profiles?.full_name || 'Unknown Member';
              const isOnline = index < onlineMembersCount; // Mock logic
              
              return (
                <View key={member.user_id} style={styles.memberItem}>
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={{ uri: member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1193d4&color=fff` }} 
                      style={styles.avatar} 
                    />
                    {isOnline && <View style={styles.onlineDot} />}
                  </View>
                  
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{fullName}</Text>
                    {isOnline ? (
                      <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusTextOnline}>Online</Text>
                      </View>
                    ) : (
                      <Text style={styles.statusTextOffline}>Last seen 2h ago</Text>
                    )}
                  </View>

                  <TouchableOpacity style={styles.chatButton}>
                    <MaterialIcons 
                      name="chat-bubble" 
                      size={20} 
                      color="#1193d4" 
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
    borderRadius: 20,
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
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1193d4',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 32,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1193d4',
  },
  tabText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#1193d4',
  },
  membersList: {
    backgroundColor: '#ffffff',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusTextOnline: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#22c55e',
  },
  statusTextOffline: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledIcon: {
    // Note: React Native Vector Icons don't have a direct 'filled' property like Material Symbols
    // but many have separate filled versions or we can use the default.
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
