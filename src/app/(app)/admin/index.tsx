import { AlertCircle, ArrowLeft, ChevronDown, ChevronUp, CloudUpload, HelpCircle, Layout, MessageCircle, Plus, Shield, ShieldAlert, Trash2, UserMinus, UserPlus, Vote, XCircle } from 'lucide-react-native';


import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Image, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { fullName, globalRole, neighborhoodId, handleAuthError } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'pending' | 'members' | 'rejected'>('pending');
  const [neighborhood, setNeighborhood] = useState<any>(null);
  
  // Member Management State
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [existingUserPhones, setExistingUserPhones] = useState<Set<string>>(new Set());

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [savingAd, setSavingAd] = useState(false);

  // Gamification Management State
  const [gamificationSettings, setGamificationSettings] = useState<any>(null);
  const [activeGamificationTab, setActiveGamificationTab] = useState<'points' | 'levels' | 'moderation'>('points');
  const [savingGamification, setSavingGamification] = useState(false);
  const [loadingGamification, setLoadingGamification] = useState(true);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);

  // Direct Messaging Management State
  const [isDmEnabled, setIsDmEnabled] = useState(true);
  const [maxDailyMessages, setMaxDailyMessages] = useState(10);
  const [savingDmSettings, setSavingDmSettings] = useState(false);

  // Proactive Invite State
  const [proactiveName, setProactiveName] = useState('');
  const [proactivePhone, setProactivePhone] = useState('');
  const [sendingProactiveInvite, setSendingProactiveInvite] = useState(false);

  // Announcement Management State
  const [pendingAnnouncements, setPendingAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const fetchPendingAnnouncements = async () => {
    if (!neighborhoodId) return;
    setLoadingAnnouncements(true);
    try {
      const { data, error } = await insforge.database
        .from('announcements')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || []).map((a: any) => ({
        ...a,
        author: Array.isArray(a.author) ? a.author[0] : a.author
      }));
      setPendingAnnouncements(formatted);
    } catch (err) {
      console.error('Failed to load pending announcements', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleApproveAnnouncement = async (id: string) => {
    try {
      const { error } = await insforge.database
        .from('announcements')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      setPendingAnnouncements(pendingAnnouncements.filter(a => a.id !== id));
      Alert.alert('Success', 'Announcement approved and posted.');
    } catch (err) {
      console.error('Failed to approve announcement', err);
      Alert.alert('Error', 'Failed to approve announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await insforge.database
                .from('announcements')
                .delete()
                .eq('id', id);

              if (error) throw error;
              setPendingAnnouncements(pendingAnnouncements.filter(a => a.id !== id));
              Alert.alert('Success', 'Announcement deleted.');
            } catch (err) {
              console.error('Failed to delete announcement', err);
              Alert.alert('Error', 'Failed to delete announcement.');
            }
          }
        }
      ]
    );
  };

  const saveDmSettings = async () => {
    if (!neighborhoodId) return;
    setSavingDmSettings(true);
    try {
      const { error } = await insforge.database
        .from('neighborhoods')
        .update({
          is_dm_enabled: isDmEnabled,
          max_daily_messages: maxDailyMessages,
        })
        .eq('id', neighborhoodId);

      if (error) throw error;
      Alert.alert('Success', 'Direct Messaging settings updated.');
    } catch (err) {
      console.error('Failed to save DM settings:', err);
      Alert.alert('Error', 'Failed to save DM settings.');
    } finally {
      setSavingDmSettings(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picking failed:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      fetchActiveMembersCount();
      if (neighborhoodId) {
        fetchQuestions();
        fetchNeighborhood();
        fetchGamificationSettings();
        fetchEligibleUsers();
        fetchMembers();
        fetchPendingAnnouncements();
      }
      if (globalRole === 'super_admin' && neighborhoodId) {
        fetchElectionInfo();
        fetchBoardPositions();
        fetchPolls();
        fetchAdminAds();
      }
    }, [globalRole, neighborhoodId])
  );

  const fetchMembers = async () => {
    if (!neighborhoodId) return;
    setLoadingMembers(true);
    try {
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          is_blocked,
          joined_at,
          profile:user_profiles(full_name, phone, avatar_url, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || []).map((m: any) => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
      }));
      setAllMembers(formatted);

      // Collect all phones for duplicate detection
      const phones = new Set<string>();
      formatted.forEach((m: any) => {
        if (m.profile?.phone) phones.add(m.profile.phone);
      });
      setExistingUserPhones(phones);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    const action = currentBlocked ? 'Unblock' : 'Block';
    Alert.alert(
      `${action} Member`,
      `Are you sure you want to ${action.toLowerCase()} this member? ${currentBlocked ? 'They will regain access to neighborhood features.' : 'They will be restricted from participating in the community.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: currentBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await insforge.database
                .from('user_neighborhoods')
                .update({ is_blocked: !currentBlocked })
                .eq('user_id', userId)
                .eq('neighborhood_id', neighborhoodId);

              if (error) throw error;
              setAllMembers(allMembers.map(m => m.user_id === userId ? { ...m, is_blocked: !currentBlocked } : m));
              Alert.alert('Success', `Member ${action.toLowerCase()}ed.`);
            } catch (err) {
              console.error('Failed to toggle block:', err);
              Alert.alert('Error', 'Failed to update member status.');
            }
          }
        }
      ]
    );
  };

  const fetchEligibleUsers = async () => {
    if (!neighborhoodId) return;
    try {
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select(`
          user_id,
          full_name,
          points,
          level,
          eligible_for_moderator
        `)
        .eq('eligible_for_moderator', true);

      if (error) throw error;

      // Filter by neighborhood via a join or subquery if needed, 
      // but for MVP we'll check if they are in the user_neighborhoods for this neighborhood
      const { data: memberData } = await insforge.database
        .from('user_neighborhoods')
        .select('user_id, role')
        .eq('neighborhood_id', neighborhoodId);
      
      const neighborhoodUserIds = (memberData || []).map(m => m.user_id);
      const filteredEligible = (data || []).filter(u => 
        neighborhoodUserIds.includes(u.user_id) && 
        !(memberData || []).find(m => m.user_id === u.user_id && (m.role === 'admin' || m.role === 'moderator'))
      );

      setEligibleUsers(filteredEligible);
    } catch (err) {
      console.error('Failed to fetch eligible users:', err);
    }
  };

  const promoteToModerator = async (userId: string) => {
    try {
      // 1. Update role in user_neighborhoods
      const { error: roleError } = await insforge.database
        .from('user_neighborhoods')
        .update({ role: 'moderator' })
        .eq('user_id', userId)
        .eq('neighborhood_id', neighborhoodId);

      if (roleError) throw roleError;

      // 2. Clear eligibility flag
      const { error: flagError } = await insforge.database
        .from('user_profiles')
        .update({ eligible_for_moderator: false })
        .eq('user_id', userId);

      if (flagError) throw flagError;

      Alert.alert('Success', 'User promoted to Moderator successfully.');
      fetchEligibleUsers();
    } catch (err) {
      console.error('Failed to promote user:', err);
      Alert.alert('Error', 'Failed to promote user.');
    }
  };

  const fetchGamificationSettings = async () => {
    if (!neighborhoodId) return;
    setLoadingGamification(true);
    try {
      const { data, error } = await insforge.database
        .from('gamification_settings')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default settings if they don't exist
        const defaultSettings = {
          neighborhood_id: neighborhoodId,
          is_active: true,
          points_announcement: 3,
          points_invite_accepted: 5,
          points_work_order_feedback: 2,
          points_forum_topic: 2,
          points_classified_ad: 2,
          points_grievance_submission: 3,
          points_event_qna_reply: 0,
          level_1_threshold: 0,
          level_2_threshold: 25,
          level_3_threshold: 50,
          max_levels: 3,
          moderator_threshold: 25,
        };

        const { data: newData, error: createError } = await insforge.database
          .from('gamification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) throw createError;
        setGamificationSettings(newData);
      } else {
        setGamificationSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch gamification settings:', err);
    } finally {
      setLoadingGamification(false);
    }
  };

  const saveGamificationSettings = async (updatedSettings: any) => {
    if (!neighborhoodId || !gamificationSettings) return;
    setSavingGamification(true);
    try {
      const { error } = await insforge.database
        .from('gamification_settings')
        .update({
          ...updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', gamificationSettings.id);

      if (error) throw error;
      setGamificationSettings({ ...gamificationSettings, ...updatedSettings });
      Alert.alert('Success', 'Gamification settings updated successfully.');
    } catch (err) {
      console.error('Failed to save gamification settings:', err);
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSavingGamification(false);
    }
  };

  const renderGamificationSettings = () => {
    if (loadingGamification) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (!gamificationSettings) {
      return <Text style={styles.emptyText}>Failed to load gamification settings.</Text>;
    }

    const renderPointsTab = () => (
      <View style={styles.adminSection}>
        <Text style={styles.adminLabel}>Points Awarded per Action</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Announcement</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_announcement)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_announcement: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Invite Accepted</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_invite_accepted)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_invite_accepted: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Work Order Feedback</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_work_order_feedback)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_work_order_feedback: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Forum Topic</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_forum_topic)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_forum_topic: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Classified Ad</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_classified_ad)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_classified_ad: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Grievance Submission</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.points_grievance_submission)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, points_grievance_submission: parseInt(text) || 0 })}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveResponseBtn, { marginTop: 16, height: 44, justifyContent: 'center' }]} 
          onPress={() => saveGamificationSettings(gamificationSettings)}
          disabled={savingGamification}
        >
          {savingGamification ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { textAlign: 'center' }]}>Save Points Configuration</Text>
          )}
        </TouchableOpacity>
      </View>
    );

    const renderLevelsTab = () => (
      <View style={styles.adminSection}>
        <Text style={styles.adminLabel}>Level Thresholds (Points Required)</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Level 2 Threshold</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.level_2_threshold)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, level_2_threshold: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Level 3 Threshold</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.level_3_threshold)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, level_3_threshold: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Maximum Levels</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.max_levels)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, max_levels: parseInt(text) || 1 })}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveResponseBtn, { marginTop: 16, height: 44, justifyContent: 'center' }]} 
          onPress={() => saveGamificationSettings(gamificationSettings)}
          disabled={savingGamification}
        >
          {savingGamification ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { textAlign: 'center' }]}>Save Level Configuration</Text>
          )}
        </TouchableOpacity>
      </View>
    );

    const renderModerationTab = () => (
      <View style={styles.adminSection}>
        <Text style={styles.adminLabel}>Moderation & Rules</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Moderator Eligibility Threshold (Points)</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.moderator_threshold)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, moderator_threshold: parseInt(text) || 0 })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Daily Points Cap (0 for No Cap)</Text>
          <TextInput
            style={styles.adminInput}
            value={String(gamificationSettings.daily_points_cap || 0)}
            keyboardType="number-pad"
            onChangeText={(text) => setGamificationSettings({ ...gamificationSettings, daily_points_cap: parseInt(text) || null })}
          />
        </View>

        <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.inputLabel}>Gamification Engine Active</Text>
          <TouchableOpacity 
            onPress={() => {
              const newVal = !gamificationSettings.is_active;
              saveGamificationSettings({ is_active: newVal });
            }}
            style={[styles.qaBadge, gamificationSettings.is_active ? styles.publicBadge : styles.privateBadge, { paddingHorizontal: 16, paddingVertical: 8 }]}
          >
            <Text style={styles.qaBadgeText}>{gamificationSettings.is_active ? 'Active' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveResponseBtn, { marginTop: 8, height: 44, justifyContent: 'center' }]} 
          onPress={() => saveGamificationSettings(gamificationSettings)}
          disabled={savingGamification}
        >
          {savingGamification ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { textAlign: 'center' }]}>Save Moderation Rules</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.adminLabel, { marginTop: 24 }]}>Moderator Eligibility Queue</Text>
        {eligibleUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users eligible for promotion currently.</Text>
        ) : (
          eligibleUsers.map((user) => (
            <View key={user.user_id} style={[styles.positionItem, { paddingVertical: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.positionTitle}>{user.full_name}</Text>
                <Text style={styles.positionDesc}>Level {user.level} • {user.points} Points</Text>
              </View>
              <TouchableOpacity 
                style={[styles.approveBtn, { height: 32, paddingVertical: 0, justifyContent: 'center' }]} 
                onPress={() => promoteToModerator(user.user_id)}
              >
                <Text style={styles.approveText}>Promote</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );

    return (
      <View>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeGamificationTab === 'points' && styles.activeTabButton]}
            onPress={() => setActiveGamificationTab('points')}
          >
            <Text style={[styles.tabText, activeGamificationTab === 'points' && styles.activeTabText]}>Points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeGamificationTab === 'levels' && styles.activeTabButton]}
            onPress={() => setActiveGamificationTab('levels')}
          >
            <Text style={[styles.tabText, activeGamificationTab === 'levels' && styles.activeTabText]}>Levels</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeGamificationTab === 'moderation' && styles.activeTabButton]}
            onPress={() => setActiveGamificationTab('moderation')}
          >
            <Text style={[styles.tabText, activeGamificationTab === 'moderation' && styles.activeTabText]}>Moderation</Text>
          </TouchableOpacity>
        </View>

        {activeGamificationTab === 'points' && renderPointsTab()}
        {activeGamificationTab === 'levels' && renderLevelsTab()}
        {activeGamificationTab === 'moderation' && renderModerationTab()}
      </View>
    );
    };

    const fetchNeighborhood = async () => {

    try {
      const { data, error } = await insforge.database
        .from('neighborhoods')
        .select('*')
        .eq('id', neighborhoodId)
        .single();
      
      if (data) {
        setNeighborhood(data);
        setIsDmEnabled(data.is_dm_enabled ?? true);
        setMaxDailyMessages(data.max_daily_messages ?? 10);
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
    const { business_name, website_url } = newAd;
    if (!business_name || !website_url || !imageUri) {
      Alert.alert('Error', 'Business Name, Website URL, and Image are required');
      return;
    }

    setSavingAd(true);
    let uploadedImageUrl = null;
    try {
      // 1. Upload image if present
      if (imageUri) {
        let fileExt = 'jpg';
        if (imageUri.includes('.') && !imageUri.startsWith('blob:') && !imageUri.startsWith('data:')) {
          fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
        }
        
        const fileName = `ad-${Date.now()}.${fileExt}`;
        const filePath = `ads/${fileName}`;
        
        const fileResponse = await fetch(imageUri);
        const blob = await fileResponse.blob();
        
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('ad-media')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;
        uploadedImageUrl = uploadData?.url;
      }

      const { data, error } = await insforge.database
        .from('advertisements')
        .insert([{
          neighborhood_id: neighborhoodId,
          ...newAd,
          image_url: uploadedImageUrl
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
      setImageUri(null);
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
          author:user_profiles(full_name, is_visible, anonymous_id)
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
      const { error: updateError } = await insforge.database
        .from('join_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request.id);
      
      if (updateError) throw updateError;
        
      // 2. We generate an invite code
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 3. Insert invite into database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: request.neighborhood_id,
          phone: request.phone,
          expires_at: expiresAt.toISOString()
        }]);

      if (inviteError) throw inviteError;
        
      // 4. Call Edge Function to send SMS
      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: request.phone,
          inviteCode: inviteCode,
          neighborhoodName: neighborhood?.name || 'your neighborhood',
          adminName: fullName || 'Bashir',
          residentName: request.name
        }
      });

      if (smsError || (smsData && !smsData.success)) {
        console.error('Failed to send SMS:', smsError || smsData?.error);
        Alert.alert(
          'Request Approved (SMS Failed)',
          `The request was approved and code ${inviteCode} was generated, but the SMS notification failed to send. Please inform the resident manually if possible.`
        );
      } else {
        Alert.alert(
          'Invite Approved & Sent',
          `The invite has been approved and an SMS with code ${inviteCode} has been sent to ${request.name}.`
        );
      }
      
      // Refresh requests
      fetchRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
      Alert.alert('Error', 'Failed to approve request. Please try again.');
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

  const handleSendProactiveInvite = async () => {
    if (!proactiveName || !proactivePhone) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }

    if (!neighborhoodId) {
      Alert.alert('Error', 'Neighborhood context missing.');
      return;
    }

    setSendingProactiveInvite(true);
    try {
      // 1. Generate invite code
      const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Persist invite (Active by default, bypasses pending requests)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: inviteError } = await insforge.database
        .from('invites')
        .insert([{
          code: inviteCode,
          neighborhood_id: neighborhoodId,
          phone: proactivePhone,
          expires_at: expiresAt.toISOString()
        }]);

      if (inviteError) throw inviteError;

      // 3. Send SMS via Edge Function
      const { data: smsData, error: smsError } = await insforge.functions.invoke('send-invite-sms', {
        body: {
          phone: proactivePhone,
          inviteCode: inviteCode,
          neighborhoodName: neighborhood?.name || 'your neighborhood',
          adminName: fullName || 'Bashir',
          residentName: proactiveName
        }
      });

      if (smsError || (smsData && !smsData.success)) {
        Alert.alert(
          'Invite Created (SMS Failed)',
          `Invite code ${inviteCode} was created, but the SMS failed to send. You can still provide the code to ${proactiveName} manually.`
        );
      } else {
        Alert.alert('Success', `Invite sent to ${proactiveName} with code ${inviteCode}.`);
        setProactiveName('');
        setProactivePhone('');
      }
    } catch (err) {
      console.error('Failed to send proactive invite:', err);
      Alert.alert('Error', 'Failed to generate invite. Please try again.');
    } finally {
      setSendingProactiveInvite(false);
    }
  };

  const renderRequestsTab = () => {
    let data = requests;
    if (loading) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (data.length === 0) {
      return <Text style={styles.emptyText}>No pending requests found.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {data.map((req) => {
          const isDuplicate = existingUserPhones.has(req.phone);
          return (
            <View key={req.id} style={styles.requestRowExtended}>
              <View style={styles.requestInfo}>
                <View style={styles.requestMainInfo}>
                  <Text style={styles.requestName}>{req.name}</Text>
                  {isDuplicate && (
                    <View style={styles.duplicateBadge}>
                      <AlertCircle size={12} color="#ef4444" style={{marginRight: 4}} />
                      <Text style={styles.duplicateBadgeText}>Duplicate Phone</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.requestDetail}>Phone: {req.phone}</Text>
                <Text style={styles.requestDetail}>Address: {req.address || 'N/A'}</Text>
                <Text style={styles.requestDetail}>Submitted: {new Date(req.created_at).toLocaleDateString()}</Text>
              </View>
              
              <View style={styles.actionGroupVertical}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(req)}>
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(req.id)}>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMembersTab = () => {
    if (loadingMembers) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (allMembers.length === 0) {
      return <Text style={styles.emptyText}>No members found.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {allMembers.map((member) => (
          <View key={member.user_id} style={[styles.requestRowExtended, member.is_blocked && styles.blockedRow]}>
            <View style={styles.requestInfo}>
              <View style={styles.requestMainInfo}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  {member.profile?.avatar_url ? (
                    <Image source={{ uri: member.profile.avatar_url }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarInitial}>
                        {(member.profile?.full_name || 'U').charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={[styles.requestName, member.is_blocked && styles.blockedText]}>
                      {member.profile?.is_visible !== false ? member.profile?.full_name : `${member.profile?.anonymous_id} (?)`}
                    </Text>
                    <Text style={styles.requestDetail}>{member.role.toUpperCase()}</Text>
                  </View>
                </View>
                {member.is_blocked && (
                  <View style={styles.privateBadge}>
                    <Text style={styles.qaBadgeText}>BLOCKED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.requestDetail}>Phone: {member.profile?.phone || 'N/A'}</Text>
              <Text style={styles.requestDetail}>Joined: {new Date(member.joined_at).toLocaleDateString()}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.declineBtn, {borderColor: member.is_blocked ? '#10b981' : '#ef4444'}]} 
              onPress={() => handleToggleBlock(member.user_id, member.is_blocked)}
            >
              {member.is_blocked ? (
                <UserPlus size={18} color="#10b981" strokeWidth={2} />
              ) : (
                <UserMinus size={18} color="#ef4444" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderRejectedTab = () => {
    if (rejectedRequests.length === 0) {
      return <Text style={styles.emptyText}>No rejected requests found.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {rejectedRequests.map((req) => (
          <View key={req.id} style={styles.requestRowExtended}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestName}>{req.name}</Text>
              <Text style={styles.requestDetail}>Phone: {req.phone}</Text>
              <Text style={styles.requestDetail}>Rejected on: {new Date(req.updated_at).toLocaleDateString()}</Text>
            </View>
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
          <Text style={styles.headerTitle}>Community Management</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Loma Vista West</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Members</Text>
            <Text style={styles.statValue}>{activeMembersCount.toLocaleString()}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending Joins</Text>
            <Text style={styles.statValue}>{requests.length}</Text>
          </View>
        </View>

        {/* Send Invites Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Send Proactive Invites</Text>
            <UserPlus size={20} color="#1193d4" strokeWidth={2} />
          </View>
          <Text style={styles.sectionSubtitle}>
            Bypass the approval process by sending an invite code directly to a resident's phone number.
          </Text>

          <View style={styles.adminSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Resident Name</Text>
              <TextInput
                style={styles.adminInput}
                placeholder="Jane Doe"
                value={proactiveName}
                onChangeText={setProactiveName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.adminInput}
                placeholder="(555) 000-0000"
                keyboardType="phone-pad"
                value={proactivePhone}
                onChangeText={setProactivePhone}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { height: 44, width: '100%' }, sendingProactiveInvite && styles.disabledBtn]} 
              onPress={handleSendProactiveInvite}
              disabled={sendingProactiveInvite}
            >
              {sendingProactiveInvite ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Send SMS Invite</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Membership Management Section */}

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]} 
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]} 
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'rejected' && styles.activeTabButton]} 
              onPress={() => setActiveTab('rejected')}
            >
              <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>Rejected</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'pending' && renderRequestsTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'rejected' && renderRejectedTab()}
          </View>

          {/* Engagement & Gamification Settings */}
          <View style={styles.card}>
          <View style={styles.cardHeader}>
           <Text style={styles.cardTitle}>Engagement & Gamification Settings</Text>
           <HelpCircle size={20} color="#1193d4" strokeWidth={2} />
          </View>
          {renderGamificationSettings()}
          </View>

          {/* Direct Messaging Settings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Direct Messaging Settings</Text>
              <MessageCircle size={20} color="#1193d4" strokeWidth={2} />
            </View>
            
            <View style={styles.adminSection}>
              <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.inputLabel}>Enable Direct Messaging</Text>
                <Switch 
                  value={isDmEnabled}
                  onValueChange={setIsDmEnabled}
                  trackColor={{ false: '#cbd5e1', true: '#1193d4' }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max Daily Messages per User</Text>
                <TextInput
                  style={styles.adminInput}
                  value={String(maxDailyMessages)}
                  keyboardType="number-pad"
                  onChangeText={(text) => setMaxDailyMessages(parseInt(text) || 0)}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { height: 44, width: '100%' }, savingDmSettings && styles.disabledBtn]} 
                onPress={saveDmSettings}
                disabled={savingDmSettings}
              >
                {savingDmSettings ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Messaging Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Election Management Section (Super Admin Only) */}

        {globalRole === 'super_admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Election Management</Text>
              <Vote size={20} color="#1193d4" strokeWidth={2} />
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
                    <Trash2 size={20} color="#ef4444" strokeWidth={2} />
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
                  <Plus size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.addBtnText}>Add Position</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Announcement Moderation Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Announcement Moderation</Text>
            <Shield size={20} color="#1193d4" strokeWidth={2} />
          </View>

          {loadingAnnouncements ? (
            <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
          ) : pendingAnnouncements.length === 0 ? (
            <Text style={styles.emptyText}>No pending announcements.</Text>
          ) : (
            <View style={styles.requestsContainer}>
              {pendingAnnouncements.map((item) => (
                <View key={item.id} style={styles.qaItem}>
                  <View style={styles.qaHeader}>
                    <Text style={styles.qaMember}>
                      {item.author?.full_name || 'Member'}
                    </Text>
                    <Text style={styles.qaDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.qaMember, { fontSize: 13, marginBottom: 4 }]}>{item.title}</Text>
                  <Text style={styles.qaText} numberOfLines={3}>{item.content}</Text>
                  
                  <View style={styles.actionGroup}>
                    <TouchableOpacity 
                      style={styles.approveBtn}
                      onPress={() => handleApproveAnnouncement(item.id)}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.declineBtn}
                      onPress={() => handleDeleteAnnouncement(item.id)}
                    >
                      <Text style={styles.declineText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Q&A Management Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Q & A Management</Text>
            <HelpCircle size={20} color="#1193d4" strokeWidth={2} />
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
                    <Text style={styles.qaMember}>
                      {item.author?.is_visible !== false ? item.author?.full_name : `${item.author?.anonymous_id} (?)`}
                    </Text>
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
                      <MessageCircle size={16} color="#1193d4" strokeWidth={2} />
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
              <Layout size={20} color="#1193d4" strokeWidth={2} />
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
                      <Trash2 size={20} color="#ef4444" strokeWidth={2} />
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
                
                <View style={styles.uploadContainer}>
                  <Text style={styles.adminLabel}>Upload Advertisement Image</Text>
                  <TouchableOpacity style={styles.imagePickerNode} onPress={pickImage}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <CloudUpload size={48} color="#94a3b8" strokeWidth={2} />
                        <Text style={styles.imagePickerText}>Tap to pick an image</Text>
                        <Text style={styles.imagePickerSubtext}>300x600 recommended</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.addBtn, savingAd && styles.disabledBtn]} 
                  onPress={handleCreateAd}
                  disabled={savingAd}
                >
                  {savingAd ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Plus size={20} color="#fff" strokeWidth={2} />
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
    color: '#1193d4',
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
  sectionSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
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
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
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
  },
  uploadContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  imagePickerNode: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  imagePickerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 8,
  },
  imagePickerSubtext: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: 150,
  },
  duplicateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duplicateBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ef4444',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
  },
  blockedRow: {
    backgroundColor: '#fff1f2',
  },
  blockedText: {
    color: '#ef4444',
  }
});
