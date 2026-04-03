import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function QandAIndex() {
  const router = useRouter();
  const { user, handleAuthError } = useAuth();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    return `${weeks} weeks ago`;
  };

  const renderQuestion = (item: any) => {
    const isExpanded = expandedId === item.id;
    const isAnswered = !!item.answer_text;

    return (
      <View key={item.id} style={styles.questionCard}>
        <TouchableOpacity 
          style={styles.questionHeader} 
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerContent}>
            <View style={styles.statusRow}>
              {item.is_public ? (
                <View style={[styles.badge, styles.publicBadge]}>
                  <Text style={styles.badgeText}>Public</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.privateBadge]}>
                  <Text style={styles.badgeText}>Private</Text>
                </View>
              )}
              {item.member_id === user?.id && (
                <View style={[styles.badge, styles.myBadge]}>
                  <Text style={styles.badgeText}>My Question</Text>
                </View>
              )}
            </View>
            <Text style={styles.questionText}>{item.question_text}</Text>
            <Text style={styles.dateText}>{formatTimeAgo(item.created_at)}</Text>
          </View>
          <MaterialIcons 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color="#64748b" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.answerContainer}>
            <View style={styles.divider} />
            {isAnswered ? (
              <View>
                <View style={styles.answerHeader}>
                  <MaterialIcons name="admin-panel-settings" size={20} color="#1193d4" style={{ marginRight: 6 }} />
                  <Text style={styles.answerTitle}>Admin Response</Text>
                </View>
                <Text style={styles.answerText}>{item.answer_text}</Text>
              </View>
            ) : (
              <View style={styles.pendingContainer}>
                <MaterialIcons name="schedule" size={20} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.pendingText}>Awaiting admin response...</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Q & A</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(app)/q-and-a/submit' as any)}
          style={styles.iconButton}
        >
          <MaterialIcons name="add-circle" size={24} color="#1193d4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <MaterialIcons name="info-outline" size={24} color="#1193d4" style={{ marginBottom: 8 }} />
          <Text style={styles.introTitle}>Neighborhood Q & A</Text>
          <Text style={styles.introDescription}>
            Ask questions to your neighborhood admins. Public questions are visible to all members.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="help-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No questions found.</Text>
            <Text style={styles.emptySubtext}>Be the first to ask a question!</Text>
          </View>
        ) : (
          questions.map(renderQuestion)
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1193d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  introDescription: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  badge: {
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
  myBadge: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
  },
  badgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#475569',
    textTransform: 'uppercase',
  },
  questionText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#fafbfc',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
  },
  answerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pendingText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
