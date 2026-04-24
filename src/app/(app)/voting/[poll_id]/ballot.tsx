import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../../lib/insforge';
import { useAuthStore } from '../../../../store/useAuthStore';

export default function BallotScreen() {
  const { poll_id } = useLocalSearchParams<{ poll_id: string }>();
  const router = useRouter();
  const { session, handleAuthError } = useAuthStore();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, [poll_id]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from('candidates')
        .select(`
          *,
          user_profiles(full_name, avatar_url)
        `)
        .eq('poll_id', poll_id);

      if (error) throw error;
      setCandidates(data || []);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async () => {
    if (!selectedCandidate) {
      Alert.alert('Selection Required', 'Please select a candidate before voting.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await insforge.database.from('poll_votes').insert([{
        poll_id,
        candidate_id: selectedCandidate,
        user_id: session?.user?.id,
      }]);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'You have already voted in this poll.');
          return;
        }
        throw error;
      }

      router.push(`/(app)/voting/${poll_id}/confirmation` as any);
    } catch (err) {
      console.error('Vote submission error', err);
      handleAuthError(err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111618" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Board Elections</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.candidatesTitle}>Candidates</Text>

        <View style={styles.candidatesList}>
          {loading ? (
            <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
          ) : candidates.length === 0 ? (
            <Text style={styles.emptyText}>No candidates available yet.</Text>
          ) : (
            candidates.map((c, index) => {
              const profile = Array.isArray(c.user_profiles) ? c.user_profiles[0] : c.user_profiles;
              const userName = profile?.full_name || 'Anonymous Candidate';
              const isSelected = selectedCandidate === c.id;
              const isLast = index === candidates.length - 1;

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.candidateRow,
                    !isLast && styles.candidateRowBorder,
                    isSelected && styles.candidateRowSelected,
                  ]}
                  onPress={() => setSelectedCandidate(c.id)}
                >
                  <Image
                    source={{ uri: c.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=1193d4&color=fff&size=150' }}
                    style={styles.candidateAvatar}
                  />
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{userName}</Text>
                    <Text style={styles.candidateRole} numberOfLines={1}>
                      {c.bio ? c.bio.substring(0, 45) + '...' : 'Candidate for Board of Directors'}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <CheckCircle2 size={22} color="#1193d4" strokeWidth={2} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/(app)/voting/${poll_id}/candidate/${c.id}` as any);
                    }}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Footer Vote Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.voteButton, !selectedCandidate && styles.voteButtonDisabled]}
          disabled={!selectedCandidate || submitting}
          onPress={submitVote}
        >
          <Text style={styles.voteButtonText}>
            {submitting ? 'Submitting...' : 'Vote'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
    backgroundColor: 'rgba(246,247,248,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7f8',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  candidatesTitle: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    marginBottom: 16,
  },
  candidatesList: {
    backgroundColor: '#f6f7f8',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  candidateRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  candidateRowSelected: {
    backgroundColor: 'rgba(17, 147, 212, 0.06)',
  },
  candidateAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    marginBottom: 2,
  },
  candidateRole: {
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    color: '#6b7280',
  },
  selectedIndicator: {
    marginRight: 4,
  },
  viewButton: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontFamily: 'Manrope-SemiBold',
    color: '#1193d4',
  },
  loader: {
    marginVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    padding: 32,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 24,
  },
  voteButton: {
    width: '100%',
    backgroundColor: '#1193d4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voteButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
});
