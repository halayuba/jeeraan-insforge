import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function VotingIndex() {
  const router = useRouter();
  const { neighborhoodId, handleAuthError } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [boardPositions, setBoardPositions] = useState<any[]>([]);
  const [votingDate, setVotingDate] = useState<string | null>(null);
  const [electionPollId, setElectionPollId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingElection, setLoadingElection] = useState(true);

  useEffect(() => {
    if (neighborhoodId) {
      fetchPolls();
      fetchElectionData();
    }
  }, [neighborhoodId]);

  const fetchPolls = async () => {
    try {
      const { data, error } = await insforge.database
        .from('polls')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolls(data || []);

      // Find the latest active election poll
      const electionPoll = data?.find(p => p.type === 'election');
      if (electionPoll) {
        setElectionPollId(electionPoll.id);
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionData = async () => {
    setLoadingElection(true);
    try {
      // 1. Fetch Board Positions
      const { data: posData, error: posError } = await insforge.database
        .from('board_positions')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .eq('is_open', true)
        .order('created_at', { ascending: true });

      if (!posError && posData) {
        setBoardPositions(posData);
      }

      // 2. Fetch Voting Date
      const { data: dateData, error: dateError } = await insforge.database
        .from('neighborhood_election_info')
        .select('voting_date')
        .eq('neighborhood_id', neighborhoodId)
        .single();

      if (!dateError && dateData) {
        setVotingDate(dateData.voting_date);
      }
    } catch (err) {
      console.error('Error fetching election data:', err);
      handleAuthError(err);
    } finally {
      setLoadingElection(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Election Information</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Open Board Positions */}
        <Text style={styles.sectionTitle}>Open Board Positions</Text>
        <View style={styles.sectionContent}>
          {loadingElection ? (
            <ActivityIndicator size="small" color="#1193d4" style={{ marginVertical: 12 }} />
          ) : boardPositions.length === 0 ? (
            <Text style={styles.emptyText}>No open positions defined yet.</Text>
          ) : (
            boardPositions.map((pos) => (
              <View key={pos.id} style={styles.card}>
                <Text style={styles.cardTitle}>{pos.title}</Text>
                {pos.description ? <Text style={styles.cardSubtitle}>{pos.description}</Text> : null}
              </View>
            ))
          )}
        </View>

        {/* Voting Date */}
        <Text style={styles.sectionTitle}>Voting Date</Text>
        <View style={styles.votingDateCard}>
          {loadingElection ? (
            <ActivityIndicator size="small" color="#1193d4" />
          ) : (
            <Text style={styles.votingDateText}>
              {votingDate ? formatDate(votingDate) : 'Date to be announced'}
            </Text>
          )}
          <MaterialIcons name="calendar-today" size={24} color="#1193d4" />
        </View>

        {/* Active Polls */}
        <Text style={styles.sectionTitle}>Active Polls</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
        ) : polls.length === 0 ? (
          <Text style={styles.emptyText}>No active polls available at the moment.</Text>
        ) : (
          polls.map((poll) => (
            <TouchableOpacity
              key={poll.id}
              style={styles.pollCard}
              onPress={() => router.push(`/(app)/voting/${poll.id}/ballot` as any)}
            >
              <View style={styles.pollCardContent}>
                <View style={styles.pollHeaderRow}>
                  <Text style={styles.pollTitle}>{poll.title}</Text>
                  {poll.type === 'election' && (
                    <View style={styles.electionBadge}>
                      <Text style={styles.electionBadgeText}>Election</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pollDescription} numberOfLines={2}>{poll.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#1193d4" />
            </TouchableOpacity>
          ))
        )}

        {/* Run for Board CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Interested in Running?</Text>
          <Text style={styles.ctaSubtitle}>
            Submit your candidate profile to be listed in the upcoming election.
          </Text>
          <TouchableOpacity
            style={[styles.ctaButton, !electionPollId && styles.ctaButtonDisabled]}
            onPress={() => electionPollId && router.push(`/(app)/voting/${electionPollId}/submit-profile` as any)}
            disabled={!electionPollId}
          >
            <Text style={styles.ctaButtonText}>
              {electionPollId ? 'Run for Board' : 'No Active Election'}
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionContent: {
    marginBottom: 24,
    gap: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f3f4',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#617c89',
    lineHeight: 20,
  },
  votingDateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f3f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  votingDateText: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: '#111618',
  },
  loader: {
    marginVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#617c89',
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  pollCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f3f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pollCardContent: {
    flex: 1,
    marginRight: 8,
  },
  pollHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  pollTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
  },
  electionBadge: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  electionBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
    textTransform: 'uppercase',
  },
  pollDescription: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#617c89',
  },
  ctaContainer: {
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 147, 212, 0.2)',
  },
  ctaTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#111618',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#617c89',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#1193d4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
});
