import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLocalSearchParams } from 'expo-router';
import { IconThumbUp, IconThumbDown, IconSend, IconTrash, IconEdit } from '@tabler/icons-react-native';

export default function GalleryDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<any>(null);
  
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch post
      const { data: postData, error: postError } = await insforge.database
        .from('gallery_posts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (postError) throw postError;

      // Fetch user profile for post
      const { data: profileData } = await insforge.database
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', postData.user_id)
        .maybeSingle();

      let imageUrl = postData.image_url;
      if (!imageUrl.startsWith('http')) {
         const { data: urlData } = insforge.storage.from('gallery').getPublicUrl(postData.image_url);
         imageUrl = urlData.publicUrl;
      }

      setPost({
        ...postData,
        imageUrl,
        user_profile: profileData || {}
      });

      // Fetch comments
      const { data: commentsData } = await insforge.database
        .from('gallery_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
        
      if (commentsData) {
        // Fetch profiles for comments
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await insforge.database
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
          
        const profileMap: any = {};
        if (profiles) {
          profiles.forEach(p => profileMap[p.user_id] = p);
        }
        
        const enrichedComments = commentsData.map(c => ({
          ...c,
          user_profile: profileMap[c.user_id] || {}
        }));
        setComments(enrichedComments);
        
        // Check if user has commented
        if (user) {
          const uComment = enrichedComments.find(c => c.user_id === user.id);
          if (uComment) {
            setUserComment(uComment);
            setCommentText(uComment.content);
          }
        }
      }

      // Check user vote
      if (user) {
        const { data: voteData } = await insforge.database
          .from('gallery_votes')
          .select('vote_type')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (voteData) {
          setUserVote(voteData.vote_type);
        }
      }
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load picture details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: number) => {
    if (!user) return;
    
    // If clicking same vote, we could remove it, but for simplicity let's just let them update
    if (userVote === type) return;

    try {
      if (userVote !== null) {
        // Update existing vote
        await insforge.database
          .from('gallery_votes')
          .update({ vote_type: type })
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        // Insert new vote
        await insforge.database
          .from('gallery_votes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            vote_type: type
          });
      }
      
      setUserVote(type);
      // Optimistic update of vote count (not exact since we don't know if we are changing from -1 to 1)
      // Ideally we refresh data or compute properly
      fetchData(); 
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cast vote.');
    }
  };

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    try {
      if (userComment) {
        // Update
        const { error } = await insforge.database
          .from('gallery_comments')
          .update({ content: commentText.trim() })
          .eq('id', userComment.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await insforge.database
          .from('gallery_comments')
          .insert({
            post_id: post.id,
            user_id: user.id,
            content: commentText.trim()
          });
        if (error) throw error;
      }
      // Re-fetch to get enriched comments
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async () => {
    if (!user || !userComment) return;
    
    Alert.alert(
      "Delete Comment", 
      "Are you sure you want to delete this comment? You will lose the point awarded for it.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await insforge.database
                .from('gallery_comments')
                .delete()
                .eq('id', userComment.id);
              if (error) throw error;
              
              setUserComment(null);
              setCommentText('');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete comment.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Picture not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: post.imageUrl }} style={styles.fullImage} resizeMode="contain" />
        
        <View style={styles.contentSection}>
          <View style={styles.authorRow}>
            {post.user_profile?.avatar_url ? (
              <Image source={{ uri: post.user_profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View>
              <Text style={styles.authorName}>{post.user_profile?.full_name || 'Anonymous'}</Text>
              <Text style={styles.dateText}>{new Date(post.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{post.description}</Text>
          
          <View style={styles.actionsRow}>
            <View style={styles.voteGroup}>
              <TouchableOpacity 
                style={[styles.voteButton, userVote === 1 && styles.voteButtonActive]}
                onPress={() => handleVote(1)}
              >
                <IconThumbUp size={20} color={userVote === 1 ? "#ffffff" : "#64748b"} />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{post.votes_count}</Text>
              <TouchableOpacity 
                style={[styles.voteButton, userVote === -1 && styles.voteButtonActiveDown]}
                onPress={() => handleVote(-1)}
              >
                <IconThumbDown size={20} color={userVote === -1 ? "#ffffff" : "#64748b"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          
          {comments.map((c, index) => (
            <View key={c.id} style={styles.commentItem}>
              {c.user_profile?.avatar_url ? (
                <Image source={{ uri: c.user_profile.avatar_url }} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatar, styles.avatarPlaceholder]} />
              )}
              <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{c.user_profile?.full_name || 'Anonymous'}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}

          {comments.length === 0 && (
            <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.inputSection}>
        {userComment && (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>Editing your comment</Text>
            <TouchableOpacity onPress={deleteComment}>
              <IconTrash size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={300}
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
            onPress={submitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <IconSend size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  fullImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
  },
  contentSection: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e2e8f0',
  },
  authorName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1e293b',
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  description: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 4,
  },
  voteButton: {
    padding: 8,
    borderRadius: 16,
  },
  voteButtonActive: {
    backgroundColor: '#1193d4',
  },
  voteButtonActiveDown: {
    backgroundColor: '#ef4444',
  },
  voteCount: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#334155',
    marginHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  commentAuthor: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  commentText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  noCommentsText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
  inputSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  editBannerText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#b91c1c',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#1e293b',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  }
});
