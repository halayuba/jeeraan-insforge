import { AlertCircle, ArrowLeft, ChevronDown, ChevronUp, CloudUpload, Eye, HelpCircle, Layout, MessageCircle, Plus, Shield, ShieldAlert, Trash2, UserMinus, UserPlus, Vote, XCircle, DollarSign, Flag } from 'lucide-react-native';
import { IconCalendarUser, IconArrowsSort, IconFilter, IconPencilFilled } from '@tabler/icons-react-native';

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Image, Switch, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { FLOORPLAN_OPTIONS } from '../../../lib/waitlist';

// Hooks
import { useJoinRequests } from '../../../hooks/useJoinRequests';
import { useQuestions } from '../../../hooks/useQuestions';
import { useAdminNotes } from '../../../hooks/useAdminNotes';
import { useModerationQueue } from '../../../hooks/useModerationQueue';
import { useElectionInfo } from '../../../hooks/useElectionInfo';
import { useBoardPositions } from '../../../hooks/useBoardPositions';
import { usePolls } from '../../../hooks/usePolls';
import { useAdminAds } from '../../../hooks/useAdminAds';
import { useAllMembers } from '../../../hooks/useAllMembers';
import { useActiveMembersCount } from '../../../hooks/useActiveMembersCount';
import { useWaitlistRequests } from '../../../hooks/useWaitlistRequests';
import { useAdminAnnouncements } from '../../../hooks/useAdminAnnouncements';
import { useNeighborhoodSettings } from '../../../hooks/useNeighborhoodSettings';
import { useGamificationSettings } from '../../../hooks/useGamificationSettings';
import { useContentReports } from '../../../hooks/useContentReports';
import { useNeighborhood } from '../../../hooks/useNeighborhood';

export default function AdminDashboard() {
  const router = useRouter();
  const { fullName, globalRole, neighborhoodId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'members' | 'rejected' | 'moderation'>('pending');
  
  // Tab/UI State
  const [activeGamificationTab, setActiveGamificationTab] = useState<'points' | 'levels' | 'moderation'>('points');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState('');
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [newPositionDesc, setNewPositionDesc] = useState('');
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDesc, setNewPollDesc] = useState('');
  const [newPollEndTime, setNewPollEndTime] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', message: '' });
  const [proactiveName, setProactiveName] = useState('');
  const [proactivePhone, setProactivePhone] = useState('');
  const [newAd, setNewAd] = useState({
    business_name: '', industry: '', address: '', contact_info: '', website_url: '', image_url: ''
  });
  const [waitlistSort, setWaitlistSort] = useState<{ field: 'full_name' | 'created_at', direction: 'asc' | 'desc' }>({ field: 'created_at', direction: 'desc' });
  const [waitlistFilter, setWaitlistFilter] = useState<string>('All');
  const [votingDate, setVotingDate] = useState('');

  // Hooks Integration
  const { 
    pendingRequests, approvedRequests, rejectedRequests, isLoading: loadingRequests, 
    approve, decline, sendProactiveInvite, isSendingProactiveInvite 
  } = useJoinRequests(neighborhoodId);
  
  const { data: activeMembersCount = 0 } = useActiveMembersCount();
  const { members: allMembers, isLoading: loadingMembers, toggleBlock, promoteToModerator, eligibleModerators: eligibleUsers } = useAllMembers(neighborhoodId);
  const { queue: moderationQueue, isLoading: loadingModeration, moderateImage } = useModerationQueue(neighborhoodId);
  const { electionInfo, updateVotingDate, isUpdating: savingElection } = useElectionInfo(neighborhoodId);
  const { positions: boardPositions, addPosition, deletePosition } = useBoardPositions(neighborhoodId);
  const { polls, createPoll, deletePoll, isCreating: savingPoll } = usePolls(neighborhoodId);
  const { questions, isLoading: loadingQuestions, togglePublic, saveResponse, isSavingResponse: savingResponse } = useQuestions(neighborhoodId);
  const { ads: adminAds, isLoading: loadingAds, createAd, deleteAd, isCreating: savingAd } = useAdminAds(neighborhoodId);
  const { notes: adminNotes, isLoading: loadingNotes, createNote, deleteNote, isCreatingNote: savingNote } = useAdminNotes(neighborhoodId);
  const { settings: gamificationSettings, updateSettings: saveGamificationSettings, isUpdating: savingGamification, isLoading: loadingGamification } = useGamificationSettings(neighborhoodId);
  const { neighborhood, updateNeighborhood, isUpdating: savingDmSettings } = useNeighborhood(neighborhoodId);
  const { settings: neighborhoodSettings, updateSettings: updateNeighborhoodSettings, isUpdating: savingMonetization } = useNeighborhoodSettings(neighborhoodId);
  const { announcements: pendingAnnouncements, isLoading: loadingAnnouncements, approveAnnouncement, deleteAnnouncement } = useAdminAnnouncements(neighborhoodId);
  const { reports: reportedAds, isLoading: loadingReports, dismissReport, deleteReportedAd } = useContentReports(neighborhoodId, 'classified_ad');
  const { requests: waitlistRequests, isLoading: loadingWaitlist } = useWaitlistRequests(neighborhoodId, waitlistFilter, waitlistSort);

  const [isDmEnabled, setIsDmEnabled] = useState(true);
  const [maxDailyMessages, setMaxDailyMessages] = useState(10);
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);

  useEffect(() => {
    if (neighborhood) {
      setIsDmEnabled(neighborhood.is_dm_enabled ?? true);
      setMaxDailyMessages(neighborhood.max_daily_messages ?? 10);
    }
  }, [neighborhood]);

  useEffect(() => {
    if (neighborhoodSettings) {
      setMonetizationEnabled(neighborhoodSettings.classifieds_monetization_enabled);
    }
  }, [neighborhoodSettings]);

  const existingUserPhones = new Set(allMembers.map(m => m.profile?.phone).filter(Boolean));

  const saveDmSettings = async () => {
    await updateNeighborhood({ is_dm_enabled: isDmEnabled, max_daily_messages: maxDailyMessages });
  };

  const saveMonetizationSetting = async (val: boolean) => {
    await updateNeighborhoodSettings({ classifieds_monetization_enabled: val });
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

  const handleSendProactiveInvite = async () => {
    if (!proactiveName || !proactivePhone) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }
    const success = await sendProactiveInvite({ 
      name: proactiveName, 
      phone: proactivePhone,
      adminName: fullName || 'Admin',
      neighborhoodName: neighborhood?.name || 'Your Neighborhood'
    });
    if (success) {
      setProactiveName('');
      setProactivePhone('');
    }
  };

        const renderNotesSection = () => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconPencilFilled size={20} color="#1193d4" />
                <Text style={styles.cardTitle}>Notes Management</Text>
              </View>
              <Text style={styles.badgeCount}>{adminNotes.length}</Text>
            </View>
      
            <Text style={styles.sectionSubtitle}>
              Create and manage notes that will be visible to all members.
            </Text>
      
            {loadingNotes ? (
              <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
            ) : adminNotes.length === 0 ? (
              <Text style={styles.emptyText}>No notes found.</Text>
            ) : (
              <View style={{ gap: 12, marginBottom: 16 }}>
                {adminNotes.map((note) => (
                  <View key={note.id} style={styles.positionItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.positionTitle}>{note.title}</Text>
                      <Text style={styles.positionDesc} numberOfLines={1}>{note.message}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                      <Trash2 size={20} color="#ef4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
      
            <View style={styles.addPositionForm}>
              <TextInput
                style={styles.adminInput}
                value={newNote.title}
                onChangeText={(text) => setNewNote({ ...newNote, title: text })}
                placeholder="Note Title (e.g. Board Minutes)"
              />
              <TextInput
                style={[styles.adminInput, { marginTop: 8, height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                value={newNote.message}
                onChangeText={(text) => setNewNote({ ...newNote, message: text })}
                placeholder="Note Message"
                multiline
              />
              
              <TouchableOpacity 
                style={[styles.addBtn, savingNote && styles.disabledBtn]} 
                onPress={handleCreateNote}
                disabled={savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Plus size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.addBtnText}>Post Note</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

        const renderWaitlistSection = () => {
        return (
        <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconCalendarUser size={20} color="#1193d4" strokeWidth={2} />
            <Text style={styles.cardTitle}>Waitlist Management</Text>
          </View>
          <Text style={styles.badgeCount}>{waitlistRequests.length}</Text>
        </View>

        <Text style={styles.sectionSubtitle}>
          View and manage potential residents who have requested to join the waitlist.
        </Text>

        {/* Sort & Filter Controls */}
        <View style={styles.controlsRow}>
          <View style={styles.controlGroup}>
            <IconFilter size={16} color="#64748b" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['All', ...FLOORPLAN_OPTIONS.filter(o => o !== 'Any of the above')].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterChip, waitlistFilter === option && styles.activeFilterChip]}
                  onPress={() => setWaitlistFilter(option)}
                >
                  <Text style={[styles.filterChipText, waitlistFilter === option && styles.activeFilterChipText]}>
                    {option.split(':')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.controlsRow, { marginTop: 8 }]}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setWaitlistSort({ 
              field: 'full_name', 
              direction: waitlistSort.field === 'full_name' && waitlistSort.direction === 'asc' ? 'desc' : 'asc' 
            })}
          >
            <Text style={[styles.sortButtonText, waitlistSort.field === 'full_name' && styles.activeSortText]}>Name</Text>
            {waitlistSort.field === 'full_name' && (
              <IconArrowsSort size={14} color="#1193d4" style={{ transform: [{ rotate: waitlistSort.direction === 'asc' ? '0deg' : '180deg' }] }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setWaitlistSort({ 
              field: 'created_at', 
              direction: waitlistSort.field === 'created_at' && waitlistSort.direction === 'asc' ? 'desc' : 'asc' 
            })}
          >
            <Text style={[styles.sortButtonText, waitlistSort.field === 'created_at' && styles.activeSortText]}>Date</Text>
            {waitlistSort.field === 'created_at' && (
              <IconArrowsSort size={14} color="#1193d4" style={{ transform: [{ rotate: waitlistSort.direction === 'asc' ? '0deg' : '180deg' }] }} />
            )}
          </TouchableOpacity>
        </View>

        {loadingWaitlist ? (
          <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />
        ) : waitlistRequests.length === 0 ? (
          <Text style={styles.emptyText}>No waitlist requests found.</Text>
        ) : (
          <View style={styles.waitlistContainer}>
            {waitlistRequests.map((req) => (
              <View key={req.id} style={styles.waitlistRow}>
                <View style={styles.waitlistInfo}>
                  <Text style={styles.requestName}>{req.full_name}</Text>
                  <Text style={styles.requestDetail}>Phone: {req.phone_number}</Text>
                  <Text style={styles.requestDetail}>Email: {req.email_address}</Text>
                  <View style={styles.floorplanBadge}>
                    <Text style={styles.floorplanBadgeText}>{req.floorplan_interest}</Text>
                  </View>
                </View>
                <Text style={styles.waitlistDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}
        </View>
        );
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

  const handleUpdateVotingDate = async () => {
    if (!votingDate) {
      Alert.alert('Error', 'Please enter a voting date');
      return;
    }
    await updateVotingDate(votingDate);
  };

  const handleAddPosition = async () => {
    if (!newPositionTitle) {
      Alert.alert('Error', 'Please enter a position title');
      return;
    }
    await addPosition({ title: newPositionTitle, description: newPositionDesc });
    setNewPositionTitle('');
    setNewPositionDesc('');
  };

  const handleCreatePoll = async () => {
    if (!newPollTitle || !newPollEndTime) {
      Alert.alert('Error', 'Title and End Time are required');
      return;
    }
    await createPoll({
      title: newPollTitle,
      description: newPollDesc,
      end_time: newPollEndTime,
      type: 'general'
    });
    setNewPollTitle('');
    setNewPollDesc('');
    setNewPollEndTime('');
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.message) {
      Alert.alert('Error', 'Title and Message are required');
      return;
    }
    await createNote(newNote);
    setNewNote({ title: '', message: '' });
  };

  const handlePromptResponse = (item: any) => {
    setRespondingToId(item.id);
    setResponseDraft(item.answer_text || '');
  };

  const handleSaveResponse = async () => {
    if (!respondingToId) return;
    await saveResponse({ id: respondingToId, answer: responseDraft });
    setRespondingToId(null);
    setResponseDraft('');
  };

  const handleTogglePublic = async (id: string, current: boolean) => {
    await togglePublic({ id, isPublic: !current });
  };

  const handleCreateAd = async () => {
    if (!newAd.business_name) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    await createAd({ ...newAd, imageUri });
    setNewAd({ business_name: '', industry: '', address: '', contact_info: '', website_url: '', image_url: '' });
    setImageUri(null);
  };

  const toggleAdDetails = (id: string) => {
    setExpandedAdId(expandedAdId === id ? null : id);
  };

  const renderRequestsTab = () => {
    if (loadingRequests) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (pendingRequests.length === 0) {
      return <Text style={styles.emptyText}>No pending requests found.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {pendingRequests.map((req) => {
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
                <TouchableOpacity style={styles.approveBtn} onPress={() => approve({ request: req, adminName: fullName || 'Admin', neighborhoodName: neighborhood?.name || 'Your Neighborhood' })}>
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => decline(req.id)}>
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
              onPress={() => toggleBlock({ userId: member.user_id, currentBlocked: member.is_blocked })}
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

  const renderModerationTab = () => {
    if (loadingModeration) {
      return <ActivityIndicator style={{ padding: 20 }} color="#1193d4" />;
    }

    if (moderationQueue.length === 0) {
      return <Text style={styles.emptyText}>No pending images for moderation.</Text>;
    }

    return (
      <View style={styles.requestsContainer}>
        {moderationQueue.map((item) => (
          <View key={item.id} style={styles.requestRowExtended}>
            <View style={styles.requestInfo}>
              <View style={styles.requestMainInfo}>
                <Text style={styles.requestName}>{item.user?.full_name || 'Resident'}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.service_type.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.requestDetail}>Uploaded: {new Date(item.created_at).toLocaleString()}</Text>
              
              <Image 
                source={{ uri: item.image_url }} 
                style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 12 }} 
                resizeMode="cover" 
              />
              
              <View style={[styles.actionGroup, { marginTop: 16 }]}>
                <TouchableOpacity 
                  style={styles.declineBtn} 
                  onPress={() => moderateImage({ id: item.id, status: 'rejected' })}
                >
                  <Text style={styles.declineText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.approveBtn} 
                  onPress={() => moderateImage({ id: item.id, status: 'approved' })}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
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
            <Text style={styles.statValue}>{pendingRequests.length}</Text>
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
              style={[styles.saveBtn, { height: 44, width: '100%' }, isSendingProactiveInvite && styles.disabledBtn]} 
              onPress={handleSendProactiveInvite}
              disabled={isSendingProactiveInvite}
            >
              {isSendingProactiveInvite ? (
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
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'moderation' && styles.activeTabButton]} 
              onPress={() => setActiveTab('moderation')}
            >
              <Text style={[styles.tabText, activeTab === 'moderation' && styles.activeTabText]}>Moderation</Text>
              {moderationQueue.length > 0 && (
                <View style={styles.miniBadge}>
                  <Text style={styles.miniBadgeText}>{moderationQueue.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {activeTab === 'pending' && renderRequestsTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'rejected' && renderRejectedTab()}
          {activeTab === 'moderation' && renderModerationTab()}

          {renderNotesSection()}

          {renderWaitlistSection()}
          {/* Engagement & Gamification Settings */}
          <View style={styles.card}>
          <View style={styles.cardHeader}>
           <Text style={styles.cardTitle}>Engagement & Gamification Settings</Text>
           <HelpCircle size={20} color="#1193d4" strokeWidth={2} />
          </View>
          {renderGamificationSettings()}
          </View>

          {/* Classified Ads Settings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Classified Ads Settings</Text>
              <DollarSign size={20} color="#1193d4" strokeWidth={2} />
            </View>
            
            <View style={styles.adminSection}>
              <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.inputLabel}>Enable Monetization</Text>
                {savingMonetization ? (
                  <ActivityIndicator size="small" color="#1193d4" />
                ) : (
                  <Switch 
                    value={monetizationEnabled}
                    onValueChange={saveMonetizationSetting}
                    trackColor={{ false: '#cbd5e1', true: '#1193d4' }}
                  />
                )}
              </View>
              <Text style={styles.sectionSubtitle}>
                When enabled, listing fees will be charged based on the item price according to community tiers.
              </Text>

              {/* Reported Ads List */}
              <View style={[styles.divider, { marginVertical: 16 }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Flag size={18} color="#ef4444" strokeWidth={2} />
                <Text style={styles.cardTitle}>Reported Content</Text>
              </View>

              {loadingReports ? (
                <ActivityIndicator color="#1193d4" />
              ) : reportedAds.length === 0 ? (
                <Text style={styles.emptyText}>No reports pending review.</Text>
              ) : (
                reportedAds.map((report) => (
                  <View key={report.id} style={styles.qaItem}>
                    <View style={styles.qaHeader}>
                      <Text style={styles.qaMember}>Reporter: {report.reporter?.full_name || 'Anonymous'}</Text>
                      <Text style={styles.qaDate}>{new Date(report.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.qaText}>Reason: {report.reason}</Text>
                    <View style={[styles.actionGroup, { marginTop: 12 }]}>
                      <TouchableOpacity 
                        style={styles.approveBtn}
                        onPress={() => dismissReport(report.id)}
                      >
                        <Text style={styles.approveText}>Dismiss</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.declineBtn}
                        onPress={() => deleteReportedAd({ adId: report.entity_id, reportId: report.id })}
                      >
                        <Text style={styles.declineText}>Delete Ad</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
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
                  <View key={ad.id}>
                    <View style={styles.positionItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.positionTitle}>{ad.business_name}</Text>
                        <Text style={styles.positionDesc}>{ad.industry}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => toggleAdDetails(ad.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {expandedAdId === ad.id ? (
                            <ChevronUp size={20} color="#1193d4" strokeWidth={2} />
                          ) : (
                            <ChevronDown size={20} color="#1193d4" strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDeleteAd(ad.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={20} color="#ef4444" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {expandedAdId === ad.id && (
                      <View style={styles.adDetailsContainer}>
                        <View style={styles.adDetailRow}>
                          <Text style={styles.adDetailLabel}>Business Name:</Text>
                          <Text style={styles.adDetailText}>{ad.business_name}</Text>
                        </View>
                        <View style={styles.adDetailRow}>
                          <Text style={styles.adDetailLabel}>Industry:</Text>
                          <Text style={styles.adDetailText}>{ad.industry || 'N/A'}</Text>
                        </View>
                        <View style={styles.adDetailRow}>
                          <Text style={styles.adDetailLabel}>Address:</Text>
                          <Text style={styles.adDetailText}>{ad.address || 'N/A'}</Text>
                        </View>
                        <View style={styles.adDetailRow}>
                          <Text style={styles.adDetailLabel}>Contact Info:</Text>
                          <Text style={styles.adDetailText}>{ad.contact_info || 'N/A'}</Text>
                        </View>
                        <View style={styles.adDetailRow}>
                          <Text style={styles.adDetailLabel}>Website URL:</Text>
                          <Text style={styles.adDetailText}>{ad.website_url || 'N/A'}</Text>
                        </View>
                        {ad.image_url && (
                          <View style={styles.adDetailImageContainer}>
                            <Text style={styles.adDetailLabel}>Advertisement Image:</Text>
                            <Image 
                              source={{ uri: ad.image_url }} 
                              style={styles.adDetailImagePreview} 
                              resizeMode="contain" 
                            />
                          </View>
                        )}
                      </View>
                    )}
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
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
  miniBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
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
    gap: 16,
  },
  adminLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  adminInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#fff',
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1193d4',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  addBtnText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#fff',
  },
  qaItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qaMember: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  qaDate: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  qaText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  qaAnswer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1193d4',
  },
  qaAnswerLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    marginBottom: 4,
  },
  qaAnswerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#1e40af',
  },
  qaPending: {
    marginTop: 8,
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  qaActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  qaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publicBadge: {
    backgroundColor: '#f0fdf4',
  },
  privateBadge: {
    backgroundColor: '#fef2f2',
  },
  qaBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    color: '#1193d4',
  },
  qaResponseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qaResponseText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#1193d4',
  },
  responseForm: {
    marginTop: 16,
    gap: 12,
  },
  responseInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#64748b',
  },
  saveResponseBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadContainer: {
    marginTop: 16,
  },
  imagePickerNode: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  imagePickerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#1193d4',
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
  disabledBtn: {
    opacity: 0.6,
  },
  duplicateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duplicateBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ef4444',
  },
  blockedRow: {
    backgroundColor: '#fef2f2',
  },
  blockedText: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
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
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#64748b',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilterChip: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderColor: '#1193d4',
  },
  filterChipText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#1193d4',
    fontFamily: 'Manrope-Bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortButtonText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  activeSortText: {
    color: '#1193d4',
    fontFamily: 'Manrope-Bold',
  },
  waitlistContainer: {
    marginTop: 16,
    gap: 12,
  },
  waitlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  waitlistInfo: {
    flex: 1,
    gap: 2,
  },
  floorplanBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  floorplanBadgeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: '#1193d4',
  },
  waitlistDate: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  badgeCount: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontFamily: 'Manrope-Bold',
    overflow: 'hidden',
  },
  adDetailsContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  adDetailLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#64748b',
    width: 110,
  },
  adDetailText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
  },
  adDetailImageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  adDetailImagePreview: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
