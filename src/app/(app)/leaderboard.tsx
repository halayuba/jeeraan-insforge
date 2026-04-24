import { ArrowLeft, Trophy, Medal, Search, History, Star, ArrowRight, RotateCw, X } from 'lucide-react-native';

import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { insforge } from '../../lib/insforge';
import { useAuthStore } from '../../store/useAuthStore';
import { LevelBadge } from '../../components/LevelBadge';
import { useToast } from '../../contexts/ToastContext';
import { SpinWheel } from '../../components/SpinWheel';

export default function Leaderboard() {
  const router = useRouter();
  const { user, neighborhoodId, userRole, handleAuthError, refreshAuth } = useAuthStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'activities' | 'neighbors'>('activities');
  const [members, setMembers] = useState<any[]>([]);
  const [pointsLog, setPointsLog] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [gamificationSettings, setGamificationSettings] = useState<any>(null);
  const [spinEligibility, setSpinEligibility] = useState<{ canSpin: boolean; nextSpinIn?: string } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Spin Wheel State
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPoints, setTargetPoints] = useState<number | null>(null);
  const [spinLoading, setSpinLoading] = useState(false);

  const fetchData = async (isRefreshing = false) => {
    if (!neighborhoodId || !user?.id) return;
    
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      // 1. Fetch Top Neighbors
      const { data: membersData, error: membersError } = await insforge.database
        .from('user_neighborhoods')
        .select(`
          user_id,
          role,
          profiles:user_id (
            full_name,
            avatar_url,
            points,
            level,
            global_role
          )
        `)
        .eq('neighborhood_id', neighborhoodId)
        .in('role', ['resident', 'moderator']);

      if (membersError) throw membersError;
      
      const formattedMembers = (membersData || [])
        .map((item: any) => ({
          user_id: item.user_id,
          role: item.role,
          ...(Array.isArray(item.profiles) ? item.profiles[0] : item.profiles)
        }))
        .filter((m: any) => m.global_role !== 'super_admin')
        .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      
      setMembers(formattedMembers);

      // 2. Fetch My Points Log
      const { data: logData, error: logError } = await insforge.database
        .from('points_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logError) throw logError;
      setPointsLog(logData || []);

      // 3. Fetch My Current Profile (Points/Level)
      const { data: profileData, error: profileError } = await insforge.database
        .from('user_profiles')
        .select('points, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setMyStats(profileData);

      // 4. Fetch Gamification Settings
      const { data: settingsData, error: settingsError } = await insforge.database
        .from('gamification_settings')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .maybeSingle();

      if (settingsError) throw settingsError;
      setGamificationSettings(settingsData);

      // 5. Check Spin Eligibility
      const today = new Date().toISOString().split('T')[0];
      const { data: spinData, error: spinError } = await insforge.database
        .from('daily_spins')
        .select('id')
        .eq('user_id', user.id)
        .eq('neighborhood_id', neighborhoodId)
        .eq('spin_date', today)
        .maybeSingle();

      if (spinError) console.error('Error checking spin eligibility:', spinError);
      
      if (userRole !== 'resident') {
        setSpinEligibility({ canSpin: false });
      } else {
        setSpinEligibility({ canSpin: !spinData });
      }

    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [neighborhoodId, user?.id])
  );

  const handleSpinPress = async () => {
    if (isSpinning || spinLoading) return;
    
    setSpinLoading(true);
    try {
      const { data, error } = await insforge.functions.invoke('spin-wheel', {
        body: {
          userId: user.id,
          neighborhoodId: neighborhoodId
        }
      });
      
      if (error) throw error;
      
      if (data.success === false) {
        showToast(data.message || 'Could not spin the wheel.', 'error');
        setSpinLoading(false);
        return;
      }
      
      setTargetPoints(data.result_points);
      setIsSpinning(true);
    } catch (err) {
      console.error('Error spinning wheel:', err);
      showToast('Failed to start the spin. Please try again.', 'error');
      setSpinLoading(false);
    }
  };

  const onSpinResult = (points: number) => {
    if (points > 0) {
      showToast(`🎉 Congratulations! You won ${points} points!`, 'success');
    } else {
      showToast('Better luck tomorrow!', 'info');
    }
    
    // Refresh data and auth context to reflect new points/level
    fetchData(true);
    refreshAuth();
    
    // Wait a bit before closing modal
    setTimeout(() => {
      setShowSpinModal(false);
      setTargetPoints(null);
      setSpinLoading(false);
    }, 2000);
  };

  const getPointsToNextLevel = () => {
    if (!myStats || !gamificationSettings) return 0;
    const currentPoints = myStats.points || 0;
    const currentLevel = myStats.level || 1;
    
    if (currentLevel >= (gamificationSettings.max_levels || 3)) return 0;
    
    const nextLevelThreshold = currentLevel === 1 
      ? gamificationSettings.level_2_threshold 
      : gamificationSettings.level_3_threshold;
      
    return Math.max(0, nextLevelThreshold - currentPoints);
  };

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={24} color="#eab308" strokeWidth={2} />;
    if (index === 1) return <Medal size={24} color="#94a3b8" strokeWidth={2} />;
    if (index === 2) return <Medal size={24} color="#cd7f32" strokeWidth={2} />;
    return <Text style={styles.rankText}>{index + 1}</Text>;
  };

  const renderActivityItem = (item: any) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    let title = item.action_type.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    if (item.action_type === 'spin_wheel') title = 'Spin Wheel Reward';

    return (
      <View key={item.id} style={styles.activityItem}>
        <View style={styles.activityIconContainer}>
          <Star size={16} color="#1193d4" fill="#1193d4" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activityTime}>{formattedDate} • {formattedTime}</Text>
        </View>
        <Text style={styles.activityPoints}>+{item.points_awarded}</Text>
      </View>
    );
  };

  const filteredMembers = members.filter(member => {
    const fullName = member.full_name || 'Unknown Member';
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.iconButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]} 
          onPress={() => setActiveTab('activities')}
        >
          <History size={18} color={activeTab === 'activities' ? '#1193d4' : '#64748b'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>My Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'neighbors' && styles.activeTab]} 
          onPress={() => setActiveTab('neighbors')}
        >
          <Trophy size={18} color={activeTab === 'neighbors' ? '#1193d4' : '#64748b'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'neighbors' && styles.activeTabText]}>Top Neighbors</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
        ) : activeTab === 'neighbors' ? (
          <View>
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

            {filteredMembers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No neighbors found.</Text>
              </View>
            ) : (
              <View>
                {/* Highlights for Top 3 (only when not searching) */}
                {searchQuery === '' && filteredMembers.length >= 3 && (
                  <View style={styles.highlightsRow}>
                    {/* Rank 2 */}
                    <View style={[styles.highlightCard, styles.silverCard]}>
                      <View style={styles.highlightBadge}>
                        <Medal size={20} color="#94a3b8" />
                      </View>
                      <Image 
                        source={{ uri: filteredMembers[1].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(filteredMembers[1].full_name || 'U')}&background=94a3b8&color=fff` }} 
                        style={styles.highlightAvatar} 
                      />
                      <Text style={styles.highlightName} numberOfLines={1}>
                        {filteredMembers[1].full_name?.split(' ')[0]}
                      </Text>
                      <Text style={styles.highlightPoints}>{filteredMembers[1].points} pts</Text>
                    </View>

                    {/* Rank 1 */}
                    <View style={[styles.highlightCard, styles.goldCard]}>
                      <View style={styles.highlightBadge}>
                        <Trophy size={28} color="#eab308" />
                      </View>
                      <Image 
                        source={{ uri: filteredMembers[0].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(filteredMembers[0].full_name || 'U')}&background=eab308&color=fff` }} 
                        style={[styles.highlightAvatar, styles.goldAvatar]} 
                      />
                      <Text style={[styles.highlightName, styles.goldName]} numberOfLines={1}>
                        {filteredMembers[0].full_name?.split(' ')[0]}
                      </Text>
                      <Text style={styles.highlightPoints}>{filteredMembers[0].points} pts</Text>
                    </View>

                    {/* Rank 3 */}
                    <View style={[styles.highlightCard, styles.bronzeCard]}>
                      <View style={styles.highlightBadge}>
                        <Medal size={20} color="#cd7f32" />
                      </View>
                      <Image 
                        source={{ uri: filteredMembers[2].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(filteredMembers[2].full_name || 'U')}&background=cd7f32&color=fff` }} 
                        style={styles.highlightAvatar} 
                      />
                      <Text style={styles.highlightName} numberOfLines={1}>
                        {filteredMembers[2].full_name?.split(' ')[0]}
                      </Text>
                      <Text style={styles.highlightPoints}>{filteredMembers[2].points} pts</Text>
                    </View>
                  </View>
                )}

                <View style={styles.list}>
                  {filteredMembers
                    .filter((_, idx) => searchQuery !== '' || idx >= (filteredMembers.length >= 3 ? 3 : 0))
                    .map((member, index) => {
                      const actualRank = searchQuery !== '' ? members.findIndex(m => m.user_id === member.user_id) : (filteredMembers.length >= 3 ? index + 3 : index);
                      
                      return (
                        <View key={member.user_id} style={styles.item}>
                          <View style={styles.rankContainer}>
                            <Text style={styles.rankText}>{actualRank + 1}</Text>
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
                      );
                    })}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.activitiesContainer}>
            {/* My Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Total Points</Text>
                <Text style={styles.statsValue}>{myStats?.points || 0}</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Next Level</Text>
                <Text style={styles.statsValue}>{getPointsToNextLevel()} pts</Text>
                <Text style={styles.statsSubtext}>remaining</Text>
              </View>
            </View>

            {/* Spin Wheel CTA */}
            {spinEligibility?.canSpin && (
              <TouchableOpacity 
                style={styles.spinCTA}
                onPress={() => setShowSpinModal(true)}
              >
                <View style={styles.spinCTAIcon}>
                  <RotateCw size={24} color="#ffffff" />
                </View>
                <View style={styles.spinCTAContent}>
                  <Text style={styles.spinCTATitle}>Daily Spin Wheel</Text>
                  <Text style={styles.spinCTASubtitle}>Win up to 3 points today!</Text>
                </View>
                <ArrowRight size={20} color="#1193d4" />
              </TouchableOpacity>
            )}

            {/* Activities Feed */}
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {pointsLog.length === 0 ? (
              <View style={styles.emptyActivities}>
                <Text style={styles.emptyText}>You haven't earned any points yet.</Text>
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.exploreButtonText}>Explore Activities</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activityList}>
                {pointsLog.map(renderActivityItem)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Spin Wheel Modal */}
      <Modal
        visible={showSpinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isSpinning && setShowSpinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Bonus Spin</Text>
              {!isSpinning && (
                <TouchableOpacity onPress={() => setShowSpinModal(false)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.wheelWrapper}>
              <SpinWheel 
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
                targetPoints={targetPoints}
                onSpinResult={onSpinResult}
              />
            </View>

            <View style={styles.modalFooter}>
              {!isSpinning && targetPoints === null ? (
                <TouchableOpacity 
                  style={[styles.spinButton, spinLoading && styles.spinButtonDisabled]}
                  onPress={handleSpinPress}
                  disabled={spinLoading}
                >
                  {spinLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <RotateCw size={20} color="#ffffff" />
                      <Text style={styles.spinButtonText}>SPIN NOW</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : isSpinning ? (
                <Text style={styles.spinningText}>Good luck! Spinning...</Text>
              ) : (
                <Text style={styles.resultText}>
                  {targetPoints === 0 ? 'Better luck next time!' : `You won ${targetPoints} points!`}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1193d4',
  },
  tabText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#1193d4',
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
  highlightsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goldCard: {
    paddingVertical: 20,
    borderColor: '#fde68a',
    backgroundColor: '#fffcf0',
    transform: [{ scale: 1.05 }],
    zIndex: 2,
  },
  silverCard: {
    backgroundColor: '#f8fafc',
  },
  bronzeCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  highlightBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  highlightAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  goldAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderColor: '#eab308',
  },
  highlightName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 2,
  },
  goldName: {
    fontSize: 16,
  },
  highlightPoints: {
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
    color: '#1193d4',
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
  activitiesContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statsLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statsValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#0f172a',
  },
  statsSubtext: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: '#94a3b8',
  },
  spinCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1193d4',
    marginBottom: 24,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  spinCTAIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  spinCTAContent: {
    flex: 1,
  },
  spinCTATitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  spinCTASubtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyActivities: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  exploreButton: {
    marginTop: 16,
    backgroundColor: '#1193d4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  activityTime: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  activityPoints: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
  },
  wheelWrapper: {
    marginBottom: 20,
  },
  modalFooter: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  spinButton: {
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    width: '100%',
  },
  spinButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  spinButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  spinningText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: '#1193d4',
  },
  resultText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#10b981',
  },
});
