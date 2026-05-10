import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { insforge } from '../../../lib/insforge';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, Info, ShieldCheck } from 'lucide-react-native';
import { IconPlus, IconMessageCircle, IconThumbUp, IconX, IconInfoCircle } from '@tabler/icons-react-native';

export default function GalleryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('gallery_posts')
        .select('*')
        .eq('status', 'approved')
        .order('votes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await insforge.database
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
          
        const profileMap: any = {};
        if (profiles) {
          profiles.forEach(p => profileMap[p.user_id] = p);
        }
        
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

  const handleAddPress = () => {
    setShowPolicyModal(true);
  };

  const handleAgree = () => {
    setShowPolicyModal(false);
    router.push('/(app)/gallery/upload' as any);
  };

  const renderItem = ({ item }: { item: any }) => {
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
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showAlert && (
        <View style={styles.alertContainer}>
          <View style={styles.alertIcon}>
            <IconInfoCircle size={20} color="#1193d4" strokeWidth={2.5} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Gallery Site Rules</Text>
            <Text style={styles.alertText}>
              Share the beauty of our neighborhood! Post non-personal images like nature, travel, or objects. 
              Limit: 1 upload per day. Faces and identifiable people are strictly prohibited.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowAlert(false)} style={styles.alertClose}>
            <IconX size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

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
        onPress={handleAddPress}
      >
        <IconPlus size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={showPolicyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.policyIconContainer}>
                <ShieldCheck size={32} color="#1193d4" strokeWidth={2} />
              </View>
              <Text style={styles.modalTitle}>Image Policy</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.policyIntroduction}>
                By uploading an image to the Jeeraan Community Gallery, you agree to the following terms:
              </Text>
              
              <View style={styles.policyItem}>
                <View style={styles.policyBullet} />
                <Text style={styles.policyText}>Images must not contain identifiable individuals or faces.</Text>
              </View>
              
              <View style={styles.policyItem}>
                <View style={styles.policyBullet} />
                <Text style={styles.policyText}>Content must be appropriate, respectful, and non-personal.</Text>
              </View>
              
              <View style={styles.policyItem}>
                <View style={styles.policyBullet} />
                <Text style={styles.policyText}>You must own the rights to the image you are uploading.</Text>
              </View>
              
              <View style={styles.policyItem}>
                <View style={styles.policyBullet} />
                <Text style={styles.policyText}>Jeeraan reserves the right to remove content that violates community standards.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowPolicyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.agreeButton} 
                onPress={handleAgree}
              >
                <Text style={styles.agreeButtonText}>I Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 147, 212, 0.08)',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 147, 212, 0.2)',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
    marginBottom: 4,
  },
  alertText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  alertClose: {
    marginLeft: 8,
    marginTop: -4,
    marginRight: -4,
    padding: 4,
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
    backgroundColor: '#cbd5e1',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  policyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 22,
    color: '#0f172a',
  },
  modalBody: {
    marginBottom: 24,
  },
  policyIntroduction: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 8,
  },
  policyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1193d4',
    marginTop: 8,
    marginRight: 10,
  },
  policyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#64748b',
  },
  agreeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1193d4',
    alignItems: 'center',
  },
  agreeButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
