import { ArrowLeft, Mail, MessageCircle, Phone, Search } from 'lucide-react-native';


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

import { useMembers } from '../../../hooks/useMembers';
import { useAuthStore } from '../../../store/useAuthStore';
import { MemberName } from '../../../components/MemberName';

export default function MembersIndex() {
  const router = useRouter();
  const { neighborhoodId } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members = [], isLoading: loading } = useMembers(neighborhoodId);

  const filteredMembers = members.filter(member => {
    const fullName = member.profiles?.full_name || '';
    const anonymousId = member.profiles?.anonymous_id || '';
    const query = searchQuery.toLowerCase();
    
    if (member.profiles?.is_visible === false) {
      return anonymousId.toLowerCase().includes(query);
    }
    return fullName.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neighborhood Members</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={24} color="#64748b" style={styles.searchIcon} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredMembers.length === 0 ? (
          <Text style={styles.emptyText}>No members found.</Text>
        ) : (
          <View style={styles.memberList}>
            {filteredMembers.map((member) => {
              const profile = member.profiles;
              const isVisible = profile?.is_visible !== false;
              
              return (
                <View key={member.user_id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    {profile?.avatar_url && isVisible ? (
                      <Image source={{ uri: profile.avatar_url }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarInitial}>
                          {isVisible ? (profile?.full_name || 'U').charAt(0) : '?'}
                        </Text>
                      </View>
                    )}
                    <View style={{flex: 1}}>
                      <MemberName 
                        name={profile?.full_name} 
                        isVisible={profile?.is_visible} 
                        anonymousId={profile?.anonymous_id}
                        textStyle={styles.memberName}
                      />
                      <Text style={styles.memberRole}>{member.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  {isVisible && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity style={styles.actionIcon}>
                        <MessageCircle size={20} color="#1193d4" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon}>
                        <Phone size={20} color="#1193d4" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  )}
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
  memberList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#1193d4',
  },
  memberName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1e293b',
  },
  memberRole: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});
