import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, MessageSquarePlus, Search, ThumbsUp, UserCircle2 } from 'lucide-react-native';

import { useCandidateDetails } from '../../../../../../hooks/useElections';

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
  
  const { data: candidate, isLoading: loading } = useCandidateDetails(candidate_id);
  const qaItems: QAItem[] = candidate?.questions || [];

  const [activeTab, setActiveTab] = useState(0);

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
          <ArrowLeft size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Candidate Q&A</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color="#0f172a" strokeWidth={2} />
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
                    <UserCircle2 size={14} color="#1193d4" strokeWidth={2} />
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
                      <ThumbsUp size={16} color="#64748b" strokeWidth={2} />
                      <Text style={styles.reactionText}>{item.helpful_count ?? 0} Helpful</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionButton}>
                      <MessageCircle size={16} color="#64748b" strokeWidth={2} />
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
        <MessageSquarePlus size={28} color="#ffffff" strokeWidth={2} />
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
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
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
    boxShadow: '0px 4px 6px rgba(17, 147, 212, 0.3)',
    elevation: 6,
  },
});
