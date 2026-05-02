import { ArrowLeft, Send, Share2 } from 'lucide-react-native';


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { 
  useGrievance, 
  useGrievanceComments, 
  useCreateGrievanceComment,
  useIncrementGrievanceViewCount 
} from '../../../hooks/useGrievances';

export default function GrievanceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [newComment, setNewComment] = useState('');

  const { data: grievance, isLoading: grievanceLoading } = useGrievance(id as string);
  const { data: comments = [], isLoading: commentsLoading } = useGrievanceComments(id as string);
  const { mutateAsync: postComment, isPending: submitting } = useCreateGrievanceComment();
  const { mutate: incrementViews } = useIncrementGrievanceViewCount();

  useEffect(() => {
    if (id) {
      incrementViews(id as string);
    }
  }, [id]);

  const loading = grievanceLoading || (commentsLoading && !comments.length);

  const handlePostComment = async () => {
    if (!newComment.trim() || !id) return;
    
    try {
      await postComment({ grievanceId: id as string, content: newComment.trim() });
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return '#22c55e';
      case 'in progress':
        return '#3b82f6';
      case 'pending':
      default:
        return '#f97316';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'rgba(34, 197, 94, 0.1)';
      case 'in progress':
        return 'rgba(59, 130, 246, 0.1)';
      case 'pending':
      default:
        return 'rgba(249, 115, 22, 0.1)';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!grievance) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Grievance not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grievance Details</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Share2 size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoRow}>
            {/* Avatar placeholder */}
            <View style={[styles.avatar, { backgroundColor: '#e2e8f0' }]} />
            <View style={styles.userInfoTextContainer}>
              <Text style={styles.userName}>{grievance.users?.username || 'Resident'}</Text>
              <Text style={styles.submitDate}>Submitted on {formatDate(grievance.created_at)}</Text>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(grievance.status) }]}>
                <View style={[styles.statusBadgeDot, { backgroundColor: getStatusColor(grievance.status) }]} />
                <Text style={[styles.statusBadgeText, { color: getStatusColor(grievance.status) }]}>
                  {grievance.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.grievanceTitle}>{grievance.title}</Text>
          <Text style={styles.grievanceDescription}>{grievance.description}</Text>
          
          {/* Attached Images */}
          {grievance.images && grievance.images.length > 0 && (
            <View style={styles.imagesGrid}>
              {grievance.images.map((img: string, index: number) => {
                // Determine layout based on number of images
                const isSingle = grievance.images.length === 1;
                const isOdd = grievance.images.length % 2 !== 0 && index === grievance.images.length - 1;
                
                return (
                  <Image 
                    key={index}
                    source={{ uri: img }}
                    style={[
                      styles.imageItem, 
                      isSingle || isOdd ? styles.imageItemFull : styles.imageItemHalf
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            {comments.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.sortText}>Newest first</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <View style={[styles.commentAvatar, { backgroundColor: '#e2e8f0' }]} />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentName}>{comment.users?.username || 'User'}</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))}
            
            {comments.length === 0 && (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to reply!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Post Comment Section */}
      <View style={styles.postCommentSection}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#64748b"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity 
          style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={handlePostComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={20} color="#ffffff" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
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
    paddingBottom: 24,
  },
  userInfoContainer: {
    padding: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(17, 147, 212, 0.2)',
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
  },
  submitDate: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  grievanceTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 12,
  },
  grievanceDescription: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 24,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  imageItem: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  imageItemHalf: {
    width: '48%',
  },
  imageItemFull: {
    width: '100%',
  },
  commentsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
  },
  sortText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
  },
  commentsList: {
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commentName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
  },
  commentTime: {
    fontFamily: 'Manrope-Regular',
    fontSize: 10,
    color: '#64748b',
  },
  commentText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#475569',
  },
  noCommentsText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 24,
  },
  postCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
  },
  commentInput: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#0f172a',
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(17, 147, 212, 0.2)',
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
    boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
  },
});
