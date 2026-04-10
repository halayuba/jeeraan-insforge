import { ArrowLeft, ChevronRight, MessageSquare, Phone, Share2 } from 'lucide-react-native';


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../../../lib/insforge';
import { useAuth } from '../../../../../contexts/AuthContext';

export default function CandidateProfileScreen() {
  const { poll_id, candidate_id } = useLocalSearchParams<{ poll_id: string; candidate_id: string }>();
  const router = useRouter();
  const { handleAuthError } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ questions: 0, endorsements: 0, responseRate: 98 });

  useEffect(() => {
    fetchCandidateDetails();
    fetchStats();
  }, [candidate_id]);

  const fetchCandidateDetails = async () => {
    try {
      const { data, error } = await insforge.database
        .from('candidates')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('id', candidate_id)
        .single();

      if (error) throw error;
      setCandidate(data);
    } catch (err) {
      console.error('Error fetching candidate:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count, error } = await insforge.database
        .from('candidate_questions')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', candidate_id);

      if (!error) {
        setStats((prev) => ({ ...prev, questions: count || 0 }));
      }
      setStats((prev) => ({ ...prev, endorsements: Math.floor(Math.random() * 50) + 10 }));
    } catch (err) {
      console.error(err);
      handleAuthError(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!candidate) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.notFoundText}>Candidate not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = Array.isArray(candidate?.user_profiles) ? candidate.user_profiles[0] : candidate?.user_profiles;
  const userName = profile?.full_name || 'Anonymous Candidate';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Profile</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: candidate.image_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1193d4&color=fff&size=200`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.candidateName}>{userName}</Text>
          <Text style={styles.candidateRole}>Running for Board</Text>
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748b" strokeWidth={2} />
            <Text style={styles.contactText}>Contact candidate</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.messageButton}>
              <MessageSquare size={20} color="#ffffff" strokeWidth={2} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.phoneButton}>
              <Phone size={24} color="#1193d4" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Endorsements</Text>
            <Text style={styles.statValue}>{stats.endorsements}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{stats.questions}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Response Rate</Text>
            <Text style={styles.statValue}>{stats.responseRate}%</Text>
          </View>
        </ScrollView>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioTitle}>Bio</Text>
          <Text style={styles.bioText}>
            {candidate.bio || 'No biography provided.'}
          </Text>
          {candidate.assets ? (
            <>
              <Text style={[styles.bioTitle, { marginTop: 16 }]}>Community Assets</Text>
              <Text style={styles.bioText}>{candidate.assets}</Text>
            </>
          ) : null}
        </View>

        {/* Q&A Panel */}
        <View style={styles.qaContainer}>
          <View style={styles.qaPanel}>
            <View style={styles.qaPanelHeader}>
              <View style={styles.qaPanelTitleRow}>
                <MessageSquare size={22} color="#1193d4" strokeWidth={2} />
                <Text style={styles.qaPanelTitle}>Candidate Q&A</Text>
              </View>
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.qaPanelSubtitle}>
              See what neighbors are asking and read detailed responses on local policy.
            </Text>

            <TouchableOpacity
              style={styles.qaViewAllButton}
              onPress={() => router.push(`/(app)/voting/${poll_id}/candidate/${candidate_id}/qa` as any)}
            >
              <Text style={styles.qaViewAllText}>View All Candidate Q&A</Text>
              <View style={styles.qaViewAllRight}>
                <Text style={styles.qaAnswerCount}>{stats.questions} Answers</Text>
                <ChevronRight size={22} color="#1193d4" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7f8',
  },
  notFoundText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Manrope-Regular',
    marginBottom: 16,
  },
  goBackButton: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#ffffff',
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    gap: 4,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'rgba(17, 147, 212, 0.2)',
    marginBottom: 12,
  },
  candidateName: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  candidateRole: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
    color: '#1193d4',
    textAlign: 'center',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'Manrope-Regular',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#1193d4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
  phoneButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsScroll: {
    marginTop: 4,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    minWidth: 120,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  bioTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#475569',
    lineHeight: 22,
  },
  qaContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  qaPanel: {
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 147, 212, 0.2)',
    padding: 20,
  },
  qaPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qaPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qaPanelTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    marginLeft: 6,
  },
  activeChip: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeChipText: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
  qaPanelSubtitle: {
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  qaViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qaViewAllText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  qaViewAllRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qaAnswerCount: {
    fontSize: 12,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
    marginRight: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
