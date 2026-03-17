import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function ForumThread() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshAuth } = useAuth();

  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchThreadData();
  }, [id]);

  const fetchThreadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Post Details
      const { data: postData, error: postErr } = await insforge.database
        .from('forum_posts')
        .select(`*, author:user_profiles(full_name, avatar_url)`)
        .eq('id', id)
        .single();
      if (postErr) throw postErr;
      
      // Ensure author is not an array (PostgREST sometimes returns it as one for certain relations)
      const formattedPost = {
        ...postData,
        author: Array.isArray(postData.author) ? postData.author[0] : postData.author
      };
      setThread(formattedPost);

      // 2. Fetch Replies
      const { data: replyData, error: replyErr } = await insforge.database
        .from('forum_replies')
        .select(`*, author:user_profiles(full_name, avatar_url)`)
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      if (replyErr) throw replyErr;
      
      const formattedReplies = (replyData || []).map((reply: any) => ({
        ...reply,
        author: Array.isArray(reply.author) ? reply.author[0] : reply.author
      }));
      setReplies(formattedReplies);

    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!newReply.trim()) return;

    setSubmitting(true);
    try {
      const { data: userData, error: userErr } = await insforge.auth.getCurrentUser();
      
      if (userErr) throw userErr;
      if (!userData?.user) throw new Error('Not authenticated');

      const { error } = await insforge.database
        .from('forum_replies')
        .insert([{
          post_id: id,
          user_id: userData.user.id,
          content: newReply.trim(),
        }]);

      if (error) throw error;
      
      setNewReply(''); // Clear input
      fetchThreadData(); // Refresh list to get the new message
    } catch (err: any) {
      console.error('Reply error:', err);
      
      const isAuthError = 
        err.message?.includes('JWT expired') || 
        err.code === 'PGRST301' || 
        err.statusCode === 401;

      if (isAuthError) {
        showToast('Your session has expired, please sign back in to continue.', 'error');
        refreshAuth();
      } else {
        showToast(err.message || 'Failed to post reply.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const time = new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${date} at ${time}`;
  };

  if (loading && !thread) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Thread not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle avatar names assuming missing avatar url capabilities dynamically
  const getInitials = (nameStr: string) => {
    return nameStr ? nameStr.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Thread View</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* OP Post Header block */}
        <View style={styles.threadOPBlock}>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{thread.category}</Text>
            </View>
          </View>
          <Text style={styles.threadTitle}>{thread.title}</Text>
          
          <View style={styles.authorRow}>
            <View style={styles.avatarCircleOP}>
              <Text style={styles.avatarTextOP}>
                {getInitials(thread.author?.full_name || 'U')}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{thread.author?.full_name || 'Unknown User'}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(thread.created_at)}</Text>
            </View>
          </View>
          
          <Text style={styles.threadBodyText}>{thread.content}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.repliesHeader}>
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </Text>

        {/* Replies List */}
        <View style={styles.repliesList}>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.replyCard}>
              <View style={styles.authorRow}>
                <View style={styles.replyAvatar}>
                  <Text style={styles.replyAvatarText}>
                    {getInitials(reply.author?.full_name || 'R')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.replyAuthorName}>{reply.author?.full_name || 'Resident'}</Text>
                    <Text style={styles.timestamp}>{formatTimeAgo(reply.created_at)}</Text>
                  </View>
                  <Text style={styles.replyBodyText}>{reply.content}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Form */}
      <View style={styles.bottomForm}>
        <TextInput
          style={styles.replyInput}
          placeholder="Write a reply..."
          placeholderTextColor="#94a3b8"
          value={newReply}
          onChangeText={setNewReply}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!newReply.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={handleReplySubmit}
          disabled={!newReply.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#1193d4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    fontFamily: 'Manrope-Bold',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    paddingBottom: 40,
  },
  threadOPBlock: {
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  threadTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 24,
    color: '#0f172a',
    lineHeight: 32,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircleOP: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTextOP: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#64748b',
  },
  authorName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#1e293b',
  },
  timestamp: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
  },
  threadBodyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  repliesHeader: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  repliesList: {
    gap: 16,
  },
  replyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  replyAvatarText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#64748b',
  },
  replyAuthorName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  replyBodyText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginTop: 4,
  },
  bottomForm: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Handle safe area padding manually or lightly
  },
  replyInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#0f172a',
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});
