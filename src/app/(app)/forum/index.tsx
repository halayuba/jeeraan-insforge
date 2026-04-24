import {
  ArrowLeft,
  Dog,
  MessageSquare,
  PartyPopper,
  PlusCircle,
  Search,
  Trees,
  Users,
  Utensils,
} from 'lucide-react-native';

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../contexts/ToastContext';
import { LevelBadge } from '../../../components/LevelBadge';
import { MemberName } from '../../../components/MemberName';

export default function ForumIndex() {
  const router = useRouter();
  const { handleAuthError } = useAuthStore();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('forum_posts')
        .select(`
          *,
          forum_replies (count),
          author:user_profiles(full_name, avatar_url, level, is_visible, anonymous_id, global_role),
          membership:user_neighborhoods!user_id(role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        authorNeighborhoodRole: Array.isArray(post.membership) ? post.membership[0]?.role : post.membership?.role
      }));
      setPosts(formattedData);
    } catch (err: any) {
      console.error('Error fetching forum posts:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (
      cat.includes('events') ||
      cat.includes('group') ||
      cat.includes('meeting')
    )
      return Users;
    if (cat.includes('party') || cat.includes('celebration'))
      return PartyPopper;
    if (cat.includes('garden') || cat.includes('plant')) return Trees;
    if (cat.includes('pet') || cat.includes('dog') || cat.includes('cat'))
      return Dog;
    if (cat.includes('food') || cat.includes('restaurant')) return Utensils;
    return MessageSquare;
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

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive popular topics simply by reply count for MVP
  const popularTopics = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.forum_replies?.[0]?.count || 0) - (a.forum_replies?.[0]?.count || 0))
      .slice(0, 3);
  }, [filteredPosts]);

  // Derive recent ones by filtering out the ones we just displayed in popular
  const recentPosts = useMemo(() => {
    const popIds = popularTopics.map(p => p.id);
    return filteredPosts.filter(p => !popIds.includes(p.id));
  }, [filteredPosts, popularTopics]);

  const renderPostRow = (post: any) => {
    const repliesCount = post.forum_replies?.[0]?.count || 0;
    const authorLevel = post.author?.level || 1;
    const CategoryIcon = getCategoryIcon(post.category);
    
    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.postCard}
        onPress={() => router.push(`/(app)/forum/${post.id}` as any)}
      >
        <View style={styles.iconContainer}>
          <CategoryIcon size={24} color="#1193d4" strokeWidth={2} />
        </View>
        <View style={styles.postCardContent}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.postMeta}>by </Text>
            <MemberName 
              name={post.author?.full_name} 
              isVisible={post.author?.is_visible} 
              anonymousId={post.author?.anonymous_id}
              textStyle={styles.postMeta}
            />
            {post.author?.global_role !== 'super_admin' && post.authorNeighborhoodRole !== 'admin' && (
              <LevelBadge level={authorLevel} />
            )}
            <Text style={styles.postMeta}>
              • {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'} • {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forum</Text>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/(app)/forum/create' as any)}
        >
          <PlusCircle size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={24} color="#64748b" style={styles.searchIcon} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search forum"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredPosts.length === 0 ? (
          <Text style={styles.emptyText}>No topics found.</Text>
        ) : (
          <>
            {/* Popular Topics Section */}
            {popularTopics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Topics</Text>
                {popularTopics.map(renderPostRow)}
              </View>
            )}

            {/* Recent Posts Section */}
            {recentPosts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Posts</Text>
                {recentPosts.map(renderPostRow)}
              </View>
            )}
          </>
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
    backgroundColor: '#ffffff', // consistency with other headers
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
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  postCardContent: {
    flex: 1,
  },
  postTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  postMeta: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});
