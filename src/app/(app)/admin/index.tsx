import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminDashboard() {
  const { globalRole, neighborhoodId } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Election Management State
  const [votingDate, setVotingDate] = useState('');
  const [boardPositions, setBoardPositions] = useState<any[]>([]);
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [newPositionDesc, setNewPositionDesc] = useState('');
  const [savingElection, setSavingElection] = useState(false);

  // General Polls Management State
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDesc, setNewPollDesc] = useState('');
  const [newPollEndTime, setNewPollEndTime] = useState('');
  const [savingPoll, setSavingPoll] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (globalRole === 'super_admin' && neighborhoodId) {
      fetchElectionInfo();
      fetchBoardPositions();
      fetchPolls();
    }
  }, [globalRole, neighborhoodId]);

  const fetchElectionInfo = async () => {
    try {
      const { data, error } = await insforge.database
        .from('neighborhood_election_info')
        .select('voting_date')
        .eq('neighborhood_id', neighborhoodId)
        .single();
      
      if (data) {
        setVotingDate(data.voting_date);
      }
    } catch (err) {
      console.error('Failed to load election info', err);
    }
  };

  const fetchBoardPositions = async () => {
    try {
      const { data, error } = await insforge.database
        .from('board_positions')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setBoardPositions(data);
      }
    } catch (err) {
      console.error('Failed to load board positions', err);
    }
  };

  const fetchPolls = async () => {
    try {
      const { data, error } = await insforge.database
        .from('polls')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('type', 'general')
        .order('created_at', { ascending: false });
      
      if (data) {
        setPolls(data);
      }
    } catch (err) {
      console.error('Failed to load polls', err);
    }
  };

  const handleUpdateVotingDate = async () => {
    if (!votingDate) {
      Alert.alert('Error', 'Please enter a voting date');
      return;
    }

    setSavingElection(true);
    try {
      const { error } = await insforge.database
        .from('neighborhood_election_info')
        .upsert({
          neighborhood_id: neighborhoodId,
          voting_date: votingDate,
        }, { onConflict: 'neighborhood_id' });

      if (error) throw error;
      Alert.alert('Success', 'Voting date updated successfully');
    } catch (err) {
      console.error('Failed to update voting date', err);
      Alert.alert('Error', 'Failed to update voting date');
    } finally {
      setSavingElection(false);
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionTitle) {
      Alert.alert('Error', 'Please enter a position title');
      return;
    }

    try {
      const { data, error } = await insforge.database
        .from('board_positions')
        .insert([{
          neighborhood_id: neighborhoodId,
          title: newPositionTitle,
          description: newPositionDesc,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setBoardPositions([...boardPositions, data]);
      setNewPositionTitle('');
      setNewPositionDesc('');
      Alert.alert('Success', 'Board position added');
    } catch (err) {
      console.error('Failed to add position', err);
      Alert.alert('Error', 'Failed to add position');
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('board_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBoardPositions(boardPositions.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete position', err);
      Alert.alert('Error', 'Failed to delete position');
    }
  };

  const handleCreatePoll = async () => {
    if (!newPollTitle || !newPollEndTime) {
      Alert.alert('Error', 'Title and End Time are required');
      return;
    }

    setSavingPoll(true);
    try {
      const { data: sessionData } = await insforge.auth.getCurrentSession();
      
      const { data, error } = await insforge.database
        .from('polls')
        .insert([{
          neighborhood_id: neighborhoodId,
          title: newPollTitle,
          description: newPollDesc,
          end_time: newPollEndTime,
          created_by: sessionData.session?.user?.id,
          type: 'general'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPolls([data, ...polls]);
      setNewPollTitle('');
      setNewPollDesc('');
      setNewPollEndTime('');
      Alert.alert('Success', 'General poll created');
    } catch (err) {
      console.error('Failed to create poll', err);
      Alert.alert('Error', 'Failed to create poll');
    } finally {
      setSavingPoll(false);
    }
  };

  const handleDeletePoll = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('polls')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPolls(polls.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete poll', err);
      Alert.alert('Error', 'Failed to delete poll');
    }
  };

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

        {/* Election Management Section (Super Admin Only) */}
        {globalRole === 'super_admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Election Management</Text>
              <MaterialIcons name="how-to-vote" size={20} color="#1193d4" />
            </View>

            {/* Voting Date */}
            <View style={styles.adminSection}>
              <Text style={styles.adminLabel}>Voting Date (YYYY-MM-DD)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.adminInput}
                  value={votingDate}
                  onChangeText={setVotingDate}
                  placeholder="2024-11-15"
                />
                <TouchableOpacity 
                  style={[styles.saveBtn, savingElection && styles.disabledBtn]} 
                  onPress={handleUpdateVotingDate}
                  disabled={savingElection}
                >
                  {savingElection ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Board Positions */}
            <View style={styles.adminSection}>
              <Text style={styles.adminLabel}>Open Board Positions</Text>
              {boardPositions.map((pos) => (
                <View key={pos.id} style={styles.positionItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.positionTitle}>{pos.title}</Text>
                    {pos.description ? <Text style={styles.positionDesc}>{pos.description}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDeletePosition(pos.id)}>
                    <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.addPositionForm}>
                <TextInput
                  style={styles.adminInput}
                  value={newPositionTitle}
                  onChangeText={setNewPositionTitle}
                  placeholder="Position Title (e.g. Treasurer)"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newPositionDesc}
                  onChangeText={setNewPositionDesc}
                  placeholder="Brief Description"
                  multiline
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddPosition}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Position</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* General Polls Management Section (Super Admin Only) */}
        {globalRole === 'super_admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>General Polls Management</Text>
              <MaterialIcons name="poll" size={20} color="#1193d4" />
            </View>

            <View style={styles.adminSection}>
              <Text style={styles.adminLabel}>Active General Polls</Text>
              {polls.length === 0 ? (
                <Text style={styles.emptyText}>No general polls created yet.</Text>
              ) : (
                polls.map((poll) => (
                  <View key={poll.id} style={styles.positionItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.positionTitle}>{poll.title}</Text>
                      <Text style={styles.positionDesc}>Ends: {new Date(poll.end_time).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePoll(poll.id)}>
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.addPositionForm}>
                <TextInput
                  style={styles.adminInput}
                  value={newPollTitle}
                  onChangeText={setNewPollTitle}
                  placeholder="Poll Title (e.g. Yard of the Season)"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newPollDesc}
                  onChangeText={setNewPollDesc}
                  placeholder="Poll Description"
                  multiline
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newPollEndTime}
                  onChangeText={setNewPollEndTime}
                  placeholder="End Date (YYYY-MM-DD HH:MM)"
                />
                <TouchableOpacity 
                  style={[styles.addBtn, savingPoll && styles.disabledBtn]} 
                  onPress={handleCreatePoll}
                  disabled={savingPoll}
                >
                  {savingPoll ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color="#fff" />
                      <Text style={styles.addBtnText}>Create General Poll</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
  },
  adminSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  adminLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  adminInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  saveBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#fff',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  positionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  positionDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addPositionForm: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1193d4',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#fff',
  }
});
