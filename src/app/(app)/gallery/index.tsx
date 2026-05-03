import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { insforge } from '../../../lib/insforge';
import { useRouter } from 'expo-router';
import { IconPlus, IconMessageCircle, IconThumbUp } from '@tabler/icons-react-native';

export default function GalleryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Query approved posts
      // Ideally we should join with user_profiles but we can do a secondary fetch or use a database view
      // For simplicity here, we'll fetch posts then fetch profiles
      const { data, error } = await insforge.database
        .from('gallery_posts')
        .select('*')
        .eq('status', 'approved')
        .order('votes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Fetch user profiles for avatars
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await insforge.database
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
          
        const profileMap: any = {};
        if (profiles) {
          profiles.forEach(p => profileMap[p.user_id] = p);
        }
        
        // Map public URLs
        const postsWithProfiles = data.map(post => {
          let imageUrl = post.image_url;
          if (!imageUrl.startsWith('http')) {
             const { data: urlData } = insforge.storage.from('gallery').getPublicUrl(post.image_url);
             imageUrl = urlData.publicUrl;
          }
          return {
            ...post,
            imageUrl,
            user_profile: profileMap[post.user_id] || {}
          };
        });
        
        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching gallery posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // Truncate description to 60-70 chars
    const shortDesc = item.description.length > 65 
      ? item.description.substring(0, 65) + '...' 
      : item.description;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/(app)/gallery/${item.id}` as any)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        
        <View style={styles.cardContent}>
          <Text style={styles.description}>{shortDesc}</Text>
          
          <View style={styles.footer}>
            <View style={styles.userInfo}>
              {item.user_profile?.avatar_url ? (
                <Image source={{ uri: item.user_profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <Text style={styles.username} numberOfLines={1}>
                {item.user_profile?.full_name || 'Anonymous'}
              </Text>
            </View>
            
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <IconThumbUp size={14} color="#64748b" />
                <Text style={styles.statText}>{item.votes_count}</Text>
              </View>
              {/* <View style={styles.statItem}>
                <IconMessageCircle size={14} color="#64748b" />
                <Text style={styles.statText}>0</Text> 
              </View> */}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pictures have been approved yet. Be the first to post!</Text>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(app)/gallery/upload' as any)}
      >
        <IconPlus size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    height: 100,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#e2e8f0',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  description: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  avatarPlaceholder: {
    backgroundColor: '#cbd5e1',
  },
  username: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  }
});
