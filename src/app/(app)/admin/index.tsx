import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('join_requests')
        .select('*')
        .eq('status', 'pending');
        
      if (!error && data) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load pending requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    try {
      // 1. Mark request as approved
      await insforge.database
        .from('join_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);
        
      // 2. We generate an invite code for them natively
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 3. Insert invite
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: request.phone,
          expires_at: expiresAt.toISOString()
        }]);
        
      // 4. Trigger our Edge function
      // (Uses Twilio mock if Twilio credentials are not set exactly as env vars in InsForge)
      await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: request.phone,
          inviteCode: inviteCode,
          neighborhoodName: 'Jeeraan' // Using default name if missing
        }
      });
      
      // Clear from view
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await insforge.database
        .from('join_requests')
        .update({ status: 'declined' })
        .eq('id', id);
        
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Analytics</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Last 30 Days</Text>
            <MaterialIcons name="expand-more" size={16} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Users</Text>
            <Text style={styles.statValue}>1,204</Text>
            <Text style={styles.statTrendPos}>+5.2%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>New Sign-ups</Text>
            <Text style={styles.statValue}>58</Text>
            <Text style={styles.statTrendPos}>+12%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Announcements</Text>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statTrendNeg}>-3%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Service Orders</Text>
            <Text style={styles.statValue}>16</Text>
            <Text style={styles.statTrendPos}>+8%</Text>
          </View>
        </View>

        {/* Pending Requests Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pending Invite Requests</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length} New</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
          ) : requests.length > 0 ? (
            <View style={styles.requestsContainer}>
              {requests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{req.name}</Text>
                    <Text style={styles.requestPhone}>{req.phone}</Text>
                  </View>
                  <View style={styles.actionGroup}>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(req.id)}>
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(req)}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All Requests</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>No pending requests right now.</Text>
          )}
        </View>

        {/* Activity Summary Mock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Community Activity</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <Text style={styles.activityLabel}>Voting Participation</Text>
              <Text style={styles.activityValue}>72%</Text>
            </View>
            <View style={[styles.activityItem, { borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 16 }]}>
              <Text style={styles.activityLabel}>Classified Ads</Text>
              <Text style={styles.activityValue}>35 New</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  filterText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  statTrendPos: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#10b981',
  },
  statTrendNeg: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#ef4444',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
  },
  requestsContainer: {
    gap: 16,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  requestPhone: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  declineText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#475569',
  },
  approveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1193d4',
  },
  approveText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#fff',
  },
  emptyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  viewAllBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#1193d4',
  },
  activityGrid: {
    flexDirection: 'row',
    marginTop: 12,
  },
  activityItem: {
    flex: 1,
    gap: 4,
  },
  activityLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  activityValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
  }
});
