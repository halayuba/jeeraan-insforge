import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Mail, MessageSquare, Plus, X } from 'lucide-react-native';

import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { MemberName } from '../../../components/MemberName';

export default function MessagesIndex() {
  const router = useRouter();
  const { user, neighborhoodId, handleAuthError } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search Modal State
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const fetchConversations = async () => {
    if (!user || !neighborhoodId) return;
    setLoading(true);
    try {
      // In a real app, we'd use a more complex query or a view to get conversations with last message and unread count
      // For MVP, we'll fetch conversations where user is participant 1 or 2
      const { data, error } = await insforge.database
        .from('conversations')
        .select(`
          *,
          participant_1:user_profiles!participant_1_id(full_name, avatar_url, is_visible, anonymous_id),
          participant_2:user_profiles!participant_2_id(full_name, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user, neighborhoodId])
  );

  const searchMembers = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingMembers(true);
    try {
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          profiles:user_profiles(full_name, avatar_url, is_visible, anonymous_id, global_role)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .neq('user_id', user?.id)
        .ilike('user_profiles.full_name', `%${query}%`); // Simplified search for now

      if (error) throw error;
      
      const formattedData = (data || [])
        .map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        }))
        .filter((m: any) => m.profiles?.global_role !== 'super_admin');

      setSearchResults(formattedData);
    } catch (err) {
      console.error('Error searching members:', err);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const startConversation = (recipientId: string) => {
    setIsSearchModalVisible(false);
    setMemberSearchQuery('');
    setSearchResults([]);
    // Navigate to conversation thread
    router.push({
        pathname: '/(app)/messages/[id]',
        params: { id: 'new', recipientId }
    } as any);
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participant_1_id === user?.id ? conv.participant_2 : conv.participant_1;
    const name = otherParticipant?.full_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Direct Messages</Text>
        <TouchableOpacity 
          onPress={() => setIsSearchModalVisible(true)} 
          style={styles.iconButton}
        >
          <Plus size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={24} color="#64748b" style={styles.searchIcon} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Mail size={64} color="#cbd5e1" strokeWidth={1} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Start a conversation with your neighbors.</Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setIsSearchModalVisible(true)}
            >
              <Text style={styles.startButtonText}>New Message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.conversationList}>
            {filteredConversations.map((conv) => {
              const otherParticipant = conv.participant_1_id === user?.id ? conv.participant_2 : conv.participant_1;
              const isVisible = otherParticipant?.is_visible !== false;
              
              return (
                <TouchableOpacity 
                  key={conv.id} 
                  style={styles.conversationCard}
                  onPress={() => router.push(`/(app)/messages/${conv.id}` as any)}
                >
                  <View style={styles.participantInfo}>
                    {otherParticipant?.avatar_url && isVisible ? (
                      <Image source={{ uri: otherParticipant.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {isVisible ? (otherParticipant?.full_name || 'U').charAt(0) : '?'}
                        </Text>
                      </View>
                    )}
                    <View style={{flex: 1}}>
                      <View style={styles.cardHeader}>
                        <MemberName 
                          name={otherParticipant?.full_name} 
                          isVisible={otherParticipant?.is_visible} 
                          anonymousId={otherParticipant?.anonymous_id}
                          textStyle={styles.participantName}
                        />
                        <Text style={styles.timestamp}>
                          {new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.lastMessageRow}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          Click to view messages
                        </Text>
                        {/* Placeholder for unread count logic */}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* New Message / Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Search size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search neighbor name..."
                placeholderTextColor="#64748b"
                value={memberSearchQuery}
                onChangeText={searchMembers}
                autoFocus
              />
            </View>

            {isSearchingMembers ? (
              <ActivityIndicator size="small" color="#1193d4" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.resultsList}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.resultItem}
                    onPress={() => startConversation(item.user_id)}
                  >
                    <View style={styles.resultInfo}>
                      {item.profiles?.avatar_url && item.profiles?.is_visible !== false ? (
                        <Image source={{ uri: item.profiles.avatar_url }} style={styles.resultAvatar} />
                      ) : (
                        <View style={styles.resultAvatarPlaceholder}>
                          <Text style={styles.resultAvatarInitial}>
                            {(item.profiles?.full_name || 'U').charAt(0)}
                          </Text>
                        </View>
                      )}
                      <MemberName 
                        name={item.profiles?.full_name} 
                        isVisible={item.profiles?.is_visible} 
                        anonymousId={item.profiles?.anonymous_id}
                        textStyle={styles.resultName}
                      />
                    </View>
                    <Plus size={20} color="#1193d4" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  memberSearchQuery.length >= 2 ? (
                    <Text style={styles.noResults}>No neighbors found matching "{memberSearchQuery}"</Text>
                  ) : (
                    <Text style={styles.searchHint}>Type at least 2 characters to search</Text>
                  )
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  startButton: {
    marginTop: 24,
    backgroundColor: '#1193d4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  conversationList: {
    gap: 12,
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#1193d4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1e293b',
  },
  timestamp: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1193d4',
  },
  resultName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: '#1e293b',
  },
  noResults: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  searchHint: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
});
