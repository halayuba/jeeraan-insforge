import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../../../../lib/insforge';

type QAItem = {
  id: string;
  question: string;
  asked_by?: string;
  created_at?: string;
  answer?: string;
  helpful_count?: number;
  comment_count?: number;
};

const TABS = ['All Questions', 'Answered', 'Pending'];

export default function CandidateQAScreen() {
  const { poll_id, candidate_id } = useLocalSearchParams<{ poll_id: string; candidate_id: string }>();
  const router = useRouter();
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchQA();
  }, [candidate_id]);

  const fetchQA = async () => {
    try {
      const { data, error } = await insforge.database
        .from('candidate_questions')
        .select('*')
        .eq('candidate_id', candidate_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQaItems(data || []);
    } catch (err) {
      console.error('Error fetching Q&A:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = qaItems.filter((item) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return !!item.answer;
    if (activeTab === 2) return !item.answer;
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Q&A</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>No questions yet.</Text>
          ) : (
            filteredItems.map((item) => (
              <View key={item.id} style={styles.qaCard}>
                <View style={styles.questionSection}>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <View style={styles.askedByRow}>
                    <MaterialIcons name="account-circle" size={14} color="#1193d4" />
                    <Text style={styles.askedByText}>
                      {item.asked_by ? `Asked by ${item.asked_by}` : 'Anonymous'} •{' '}
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>

                {item.answer && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>CANDIDATE RESPONSE:</Text>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <View style={styles.reactionButtons}>
                    <TouchableOpacity style={styles.reactionButton}>
                      <MaterialIcons name="thumb-up" size={16} color="#64748b" />
                      <Text style={styles.reactionText}>{item.helpful_count ?? 0} Helpful</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionButton}>
                      <MaterialIcons name="chat-bubble-outline" size={16} color="#64748b" />
                      <Text style={styles.reactionText}>{item.comment_count ?? 0} Comments</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.viewThreadButton}>
                    <Text style={styles.viewThreadText}>View Full Thread</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="add-comment" size={28} color="#ffffff" />
      </TouchableOpacity>
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
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    gap: 28,
  },
  tab: {
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1193d4',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1193d4',
  },
  loader: {
    marginTop: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 96,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    marginTop: 40,
  },
  qaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  questionSection: {
    padding: 16,
    gap: 8,
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    lineHeight: 24,
  },
  askedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  askedByText: {
    fontSize: 12,
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
  },
  answerBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#1193d4',
    borderRadius: 8,
    padding: 12,
  },
  answerLabel: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    color: '#334155',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    fontSize: 12,
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
  },
  viewThreadButton: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewThreadText: {
    fontSize: 12,
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
