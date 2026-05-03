import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { IconChalkboard, IconSend, IconThumbUp } from '@tabler/icons-react-native';

export default function WhiteboardScreen() {
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [publishedQuestion, setPublishedQuestion] = useState<any>(null);
  const [candidateQuestions, setCandidateQuestions] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWhiteboardData();
  }, [user]);

  const fetchWhiteboardData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Check if there is a published question for today
      const { data: published } = await insforge.database
        .from('whiteboard_questions')
        .select('*')
        .eq('target_date', today)
        .eq('is_published', true)
        .maybeSingle();
        
      if (published) {
        setPublishedQuestion(published);
        
        // Check if user has answered
        const { data: answer } = await insforge.database
          .from('whiteboard_answers')
          .select('*')
          .eq('question_id', published.id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (answer) {
          setSubmittedAnswer(answer);
          setUserAnswer(answer.answer_text);
        }
      } else {
        // 2. Fetch candidate questions for voting
        const { data: candidates } = await insforge.database
          .from('whiteboard_questions')
          .select('*')
          .eq('target_date', today)
          .eq('is_published', false);
          
        if (candidates && candidates.length > 0) {
          setCandidateQuestions(candidates);
          
          // Check if user has voted
          const { data: userVote } = await insforge.database
            .from('whiteboard_votes')
            .select('id')
            .eq('user_id', user.id)
            // Ideally we also check target_date, but since votes are tied to question_id, and we only have today's questions:
            .in('question_id', candidates.map(q => q.id))
            .maybeSingle();
            
          if (userVote) {
            setHasVoted(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching whiteboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user || hasVoted) return;
    setSubmitting(true);
    try {
      const { error } = await insforge.database
        .from('whiteboard_votes')
        .insert({
          question_id: questionId,
          user_id: user.id
        });
        
      if (error) throw error;
      
      Alert.alert('Success', 'Your vote has been cast!');
      setHasVoted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cast vote.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !publishedQuestion || !userAnswer.trim()) return;
    setSubmitting(true);
    try {
      if (submittedAnswer) {
        // Update existing answer
        const { error } = await insforge.database
          .from('whiteboard_answers')
          .update({ answer_text: userAnswer.trim() })
          .eq('id', submittedAnswer.id);
          
        if (error) throw error;
        Alert.alert('Success', 'Your answer has been updated!');
      } else {
        // Insert new answer
        const { data, error } = await insforge.database
          .from('whiteboard_answers')
          .insert({
            question_id: publishedQuestion.id,
            user_id: user.id,
            answer_text: userAnswer.trim()
          })
          .select()
          .maybeSingle();
          
        if (error) throw error;
        setSubmittedAnswer(data);
        Alert.alert('Success', 'Your answer has been submitted! You earned 2 points.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconChalkboard size={36} color="#ffffff" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Daily Whiteboard</Text>
        <Text style={styles.subtitle}>
          {publishedQuestion 
            ? "Answer today's selected question to earn points!" 
            : "Vote for the question you want to see today!"}
        </Text>
      </View>

      {publishedQuestion ? (
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{publishedQuestion.category}</Text>
          </View>
          <Text style={styles.questionText}>{publishedQuestion.question_text}</Text>
          
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Your Answer:</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Type your answer here..."
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity 
              style={[styles.submitButton, (!userAnswer.trim() || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!userAnswer.trim() || submitting}
            >
              <IconSend size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {submittedAnswer ? 'Update Answer' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : candidateQuestions.length > 0 ? (
        <View style={styles.votingSection}>
          <Text style={styles.sectionTitle}>Today's Candidates</Text>
          {candidateQuestions.map((q) => (
            <View key={q.id} style={styles.candidateCard}>
              <View style={{flex: 1}}>
                 <View style={styles.badge}>
                  <Text style={styles.badgeText}>{q.category}</Text>
                 </View>
                 <Text style={styles.candidateText}>{q.question_text}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.voteButton, (hasVoted || submitting) && styles.voteButtonDisabled]}
                onPress={() => handleVote(q.id)}
                disabled={hasVoted || submitting}
              >
                <IconThumbUp size={20} color={hasVoted ? "#94a3b8" : "#1193d4"} />
                <Text style={[styles.voteText, hasVoted && styles.voteTextDisabled]}>Vote</Text>
              </TouchableOpacity>
            </View>
          ))}
          {hasVoted && (
            <Text style={styles.votedMessage}>You have cast your vote! Check back at noon for the winning question.</Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>The AI is preparing today's questions. Please check back soon!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  questionText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 24,
    lineHeight: 28,
  },
  answerSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  answerLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  votingSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 8,
  },
  candidateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  candidateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    paddingRight: 16,
  },
  voteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  voteButtonDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  voteText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    marginTop: 4,
  },
  voteTextDisabled: {
    color: '#94a3b8',
  },
  votedMessage: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    overflow: 'hidden'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  emptyStateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  }
});
