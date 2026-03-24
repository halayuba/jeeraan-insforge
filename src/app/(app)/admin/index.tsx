import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminDashboard() {
  const { globalRole, neighborhoodId, handleAuthError } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [neighborhood, setNeighborhood] = useState<any>(null);
  
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

  // Q&A Management State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  // Advertisements Management State
  const [adminAds, setAdminAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [newAd, setNewAd] = useState({
    business_name: '',
    industry: '',
    address: '',
    contact_info: '',
    website_url: '',
    image_url: ''
  });
  const [savingAd, setSavingAd] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchActiveMembersCount();
    if (neighborhoodId) {
      fetchQuestions();
      fetchNeighborhood();
    }
    if (globalRole === 'super_admin' && neighborhoodId) {
      fetchElectionInfo();
      fetchBoardPositions();
      fetchPolls();
      fetchAdminAds();
    }
  }, [globalRole, neighborhoodId]);

  const fetchNeighborhood = async () => {
    try {
      const { data, error } = await insforge.database
        .from('neighborhoods')
        .select('*')
        .eq('id', neighborhoodId)
        .single();
      
      if (data) {
        setNeighborhood(data);
      }
    } catch (err) {
      console.error('Failed to load neighborhood', err);
    }
  };

  const fetchAdminAds = async () => {
    setLoadingAds(true);
    try {
      const { data, error } = await insforge.database
        .from('advertisements')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminAds(data || []);
    } catch (err) {
      console.error('Failed to load advertisements', err);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleCreateAd = async () => {
    const { business_name, industry, address, contact_info, website_url, image_url } = newAd;
    if (!business_name || !website_url || !image_url) {
      Alert.alert('Error', 'Business Name, Website URL, and Image URL are required');
      return;
    }

    setSavingAd(true);
    try {
      const { data, error } = await insforge.database
        .from('advertisements')
        .insert([{
          neighborhood_id: neighborhoodId,
          ...newAd
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAdminAds([data, ...adminAds]);
      setNewAd({
        business_name: '',
        industry: '',
        address: '',
        contact_info: '',
        website_url: '',
        image_url: ''
      });
      Alert.alert('Success', 'Advertisement created');
    } catch (err) {
      console.error('Failed to create advertisement', err);
      handleAuthError(err);
      Alert.alert('Error', 'Failed to create advertisement');
    } finally {
      setSavingAd(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAdminAds(adminAds.filter(ad => ad.id !== id));
    } catch (err) {
      console.error('Failed to delete advertisement', err);
      handleAuthError(err);
      Alert.alert('Error', 'Failed to delete advertisement');
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await insforge.database
        .from('questions')
        .select(`
          *,
          author:user_profiles(full_name)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((q: any) => ({
        ...q,
        author: Array.isArray(q.author) ? q.author[0] : q.author
      }));
      setQuestions(formattedData);
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleTogglePublic = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await insforge.database
        .from('questions')
        .update({ is_public: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setQuestions(questions.map(q => q.id === id ? { ...q, is_public: !currentStatus } : q));
    } catch (err) {
      console.error('Failed to toggle question status', err);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handlePromptResponse = (item: any) => {
    setRespondingToId(item.id);
    setResponseDraft(item.answer_text || '');
  };

  const handleSaveResponse = async () => {
    if (!respondingToId) return;

    setSavingResponse(true);
    try {
      const { error } = await insforge.database
        .from('questions')
        .update({ answer_text: responseDraft.trim() })
        .eq('id', respondingToId);

      if (error) throw error;
      
      setQuestions(questions.map(q => q.id === respondingToId ? { ...q, answer_text: responseDraft.trim() } : q));
      setRespondingToId(null);
      setResponseDraft('');
      Alert.alert('Success', 'Response saved');
    } catch (err) {
      console.error('Failed to save response', err);
      Alert.alert('Error', 'Failed to save response');
    } finally {
      setSavingResponse(false);
    }
  };

  const fetchActiveMembersCount = async () => {
    try {
      const { count } = await insforge.database
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (count !== null) {
        setActiveMembersCount(count);
      }
    } catch (err) {
      console.error('Failed to load active members count', err);
    }
  };

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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
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
      handleAuthError(err);
      Alert.alert('Error', 'Failed to delete poll');
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('join_requests')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setRequests(data.filter((r: any) => r.status === 'pending'));
        setApprovedRequests(data.filter((r: any) => r.status === 'approved'));
        setRejectedRequests(data.filter((r: any) => r.status === 'declined'));
      }
    } catch (err) {
      console.error('Failed to load join requests', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: any) => {
    try {
      // 1. Mark request as approved
      await insforge.database
        .from('join_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
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
        
      // 5. Present the 6-digit code to the admin for manual sending
      Alert.alert(
        'Invite Approved',
        `The invite has been approved. Please manually send the following message to ${request.name} at ${request.phone}:\n\n"You have been invited to join the neighborhood on Jeeraan! Your invite code is: ${inviteCode}. It is valid for one-time use and will expire in 24 hours."`,
        [{ text: 'OK' }]
      );
      
      // Refresh requests
      fetchRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
      handleAuthError(err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await insforge.database
        .from('join_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', id);
        
      fetchRequests();
    } catch (err) {
      console.error('Failed to decline request:', err);
      handleAuthError(err);
    }
  };

  const renderRequestsTab = () => {
    let data = [];
    if (activeTab === 'pending') data = requests;
    else if (activeTab === 'approved') data = approvedRequests;
    else data = rejectedRequests;

    if (loading) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (data.length === 0) {
      return <Text style={styles.emptyText}>No {activeTab} requests found.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {data.map((req) => (
          <View key={req.id} style={styles.requestRowExtended}>
            <View style={styles.requestInfo}>
              <View style={styles.requestMainInfo}>
                <Text style={styles.requestName}>{req.name}</Text>
                <Text style={styles.requestNeighborhood}>{neighborhood?.name || 'Loading...'}</Text>
              </View>
              <Text style={styles.requestDetail}>Phone: {req.phone}</Text>
              <Text style={styles.requestDetail}>Address: {req.address || 'N/A'}</Text>
              <Text style={styles.requestDetail}>
                {activeTab === 'pending' ? 'Submitted on: ' : activeTab === 'approved' ? 'Joined on: ' : 'Rejected on: '}
                {new Date(activeTab === 'pending' ? req.created_at : req.updated_at).toLocaleDateString()}
              </Text>
            </View>
            
            {activeTab === 'pending' && (
              <View style={styles.actionGroupVertical}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(req)}>
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(req.id)}>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
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
            <Text style={styles.statLabel}>Active Members</Text>
            <Text style={styles.statValue}>{activeMembersCount.toLocaleString()}</Text>
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
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Events</Text>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statTrendPos}>+15%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Grievances</Text>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statTrendNeg}>-20%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Classified Ads</Text>
            <Text style={styles.statValue}>35</Text>
            <Text style={styles.statTrendPos}>+5%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Voting Participation</Text>
            <Text style={styles.statValue}>72%</Text>
            <Text style={styles.statTrendPos}>+10%</Text>
          </View>
        </View>

        {/* Pending Requests Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Invite Requests Management</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]} 
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending ({requests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'approved' && styles.activeTabButton]} 
              onPress={() => setActiveTab('approved')}
            >
              <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>Members ({approvedRequests.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'rejected' && styles.activeTabButton]} 
              onPress={() => setActiveTab('rejected')}
            >
              <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>Rejected ({rejectedRequests.length})</Text>
            </TouchableOpacity>
          </View>

          {renderRequestsTab()}
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

        {/* Q&A Management Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Q & A Management</Text>
            <MaterialIcons name="help-outline" size={20} color="#1193d4" />
          </View>

          {loadingQuestions ? (
            <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
          ) : questions.length === 0 ? (
            <Text style={styles.emptyText}>No questions submitted yet.</Text>
          ) : (
            <View style={styles.requestsContainer}>
              {questions.map((item) => (
                <View key={item.id} style={styles.qaItem}>
                  <View style={styles.qaHeader}>
                    <Text style={styles.qaMember}>{item.author?.full_name || 'Resident'}</Text>
                    <Text style={styles.qaDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.qaText}>{item.question_text}</Text>
                  
                  {item.answer_text ? (
                    <View style={styles.qaAnswer}>
                      <Text style={styles.qaAnswerLabel}>Response:</Text>
                      <Text style={styles.qaAnswerText}>{item.answer_text}</Text>
                    </View>
                  ) : (
                    <Text style={styles.qaPending}>Awaiting response</Text>
                  )}

                  {respondingToId === item.id && (
                    <View style={styles.responseForm}>
                      <TextInput
                        style={styles.responseInput}
                        value={responseDraft}
                        onChangeText={setResponseDraft}
                        placeholder="Write your response..."
                        multiline
                      />
                      <View style={styles.responseActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setRespondingToId(null)}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.saveResponseBtn, savingResponse && styles.disabledBtn]} 
                          onPress={handleSaveResponse}
                          disabled={savingResponse}
                        >
                          {savingResponse ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.saveBtnText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.qaActions}>
                    <TouchableOpacity 
                      style={[styles.qaBadge, item.is_public ? styles.publicBadge : styles.privateBadge]}
                      onPress={() => handleTogglePublic(item.id, item.is_public)}
                    >
                      <Text style={styles.qaBadgeText}>{item.is_public ? 'Public' : 'Private'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.qaResponseBtn} 
                      onPress={() => handlePromptResponse(item)}
                    >
                      <MaterialIcons name="chat-bubble-outline" size={16} color="#1193d4" />
                      <Text style={styles.qaResponseText}>{item.answer_text ? 'Edit' : 'Respond'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Advertisements Management Section (Super Admin Only) */}
        {globalRole === 'super_admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Advertisements Management</Text>
              <MaterialIcons name="featured-play-list" size={20} color="#1193d4" />
            </View>

            <View style={styles.adminSection}>
              <Text style={styles.adminLabel}>Active Advertisements</Text>
              {loadingAds ? (
                <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
              ) : adminAds.length === 0 ? (
                <Text style={styles.emptyText}>No advertisements yet.</Text>
              ) : (
                adminAds.map((ad) => (
                  <View key={ad.id} style={styles.positionItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.positionTitle}>{ad.business_name}</Text>
                      <Text style={styles.positionDesc}>{ad.industry} • {ad.website_url}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteAd(ad.id)}>
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.addPositionForm}>
                <TextInput
                  style={styles.adminInput}
                  value={newAd.business_name}
                  onChangeText={(text) => setNewAd({ ...newAd, business_name: text })}
                  placeholder="Business Name"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newAd.industry}
                  onChangeText={(text) => setNewAd({ ...newAd, industry: text })}
                  placeholder="Industry"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newAd.address}
                  onChangeText={(text) => setNewAd({ ...newAd, address: text })}
                  placeholder="Business Address"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newAd.contact_info}
                  onChangeText={(text) => setNewAd({ ...newAd, contact_info: text })}
                  placeholder="Contact Info"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newAd.website_url}
                  onChangeText={(text) => setNewAd({ ...newAd, website_url: text })}
                  placeholder="Website URL"
                />
                <TextInput
                  style={[styles.adminInput, { marginTop: 8 }]}
                  value={newAd.image_url}
                  onChangeText={(text) => setNewAd({ ...newAd, image_url: text })}
                  placeholder="Image URL (300x600 recommended)"
                />
                <TouchableOpacity 
                  style={[styles.addBtn, savingAd && styles.disabledBtn]} 
                  onPress={handleCreateAd}
                  disabled={savingAd}
                >
                  {savingAd ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color="#fff" />
                      <Text style={styles.addBtnText}>Create Advertisement</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  requestMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestNeighborhood: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#1193d4',
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requestDetail: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#475569',
  },
  requestRowExtended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  actionGroupVertical: {
    gap: 8,
    alignItems: 'flex-end',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#64748b',
  },
  activeTabText: {
    color: '#1193d4',
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
  },
  qaItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qaMember: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  qaDate: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
  },
  qaText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  qaAnswer: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#1193d4',
  },
  qaAnswerLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    marginBottom: 2,
  },
  qaAnswerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#475569',
  },
  qaPending: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  qaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  privateBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  qaBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#475569',
    textTransform: 'uppercase',
  },
  qaResponseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qaResponseText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#1193d4',
  },
  responseForm: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1193d4',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  responseInput: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#64748b',
  },
  saveResponseBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  }
});
