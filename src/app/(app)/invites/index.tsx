import { ArrowLeft, UserPlus } from 'lucide-react-native';


import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../../store/useAuthStore';
import { useInvites } from '../../../hooks/useInvites';

type JoinRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
};

export default function InvitesIndex() {
  const router = useRouter();
  const { neighborhoodId } = useAuthStore();
  const { data: requests = [], isLoading: loading, isRefetching: refreshing, refetch } = useInvites();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'declined': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invites & Requests</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} />
        }
      >
        {/* Request Invite Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => router.push('/(app)/invites/request' as any)}
          >
            <UserPlus size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.inviteButtonText}>Request Invite for a Neighbor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent invites or requests.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.cardMain}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{request.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.personName}>{request.name}</Text>
                    <Text style={styles.dateText}>Sent on {formatDate(request.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
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
  buttonContainer: {
    padding: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1193d4',
    paddingVertical: 14,
    borderRadius: 12,
    boxShadow: '0px 4px 8px rgba(17, 147, 212, 0.2)',
    elevation: 4,
  },
  inviteButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
  },
  requestCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#1193d4',
  },
  cardInfo: {
    flex: 1,
  },
  personName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 2,
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
