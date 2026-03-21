import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function AnnouncementDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { handleAuthError } = useAuth();
  
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleAuthError(error);
        return;
      }
      setAnnouncement(data);
    } catch (err) {
      console.error('Error fetching announcement details:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyles = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('safety')) return { bg: '#ffedd5', text: '#ea580c' };
    if (cat.includes('security')) return { bg: '#dbeafe', text: '#2563eb' };
    if (cat.includes('events')) return { bg: '#dcfce7', text: '#16a34a' };
    if (cat.includes('maintenance')) return { bg: '#f3e8ff', text: '#9333ea' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('safety')) return 'admin-panel-settings';
    if (cat.includes('security')) return 'security';
    if (cat.includes('events')) return 'event';
    if (cat.includes('maintenance')) return 'engineering';
    return 'announcement';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Announcement not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catStyles = getCategoryStyles(announcement.category);
  const catIcon = getCategoryIcon(announcement.category);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="share" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title & Metadata */}
        <Text style={styles.title}>{announcement.title}</Text>
        
        <View style={styles.metaContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: catStyles.bg }]}>
            <MaterialIcons name={catIcon as any} size={14} color={catStyles.text} style={styles.catIcon} />
            <Text style={[styles.categoryBadgeText, { color: catStyles.text }]}>
              {announcement.category}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatDate(announcement.created_at)}</Text>
        </View>

        {/* Author info */}
        <View style={styles.authorRow}>
          <View style={styles.authorIconContainer}>
            <MaterialIcons name="admin-panel-settings" size={20} color="#1193d4" />
          </View>
          <View>
            <Text style={styles.authorName}>Admin / Board</Text>
            <Text style={styles.authorSubtext}>Official Communication</Text>
          </View>
        </View>

        {/* Content Body */}
        <Text style={styles.contentBody}>{announcement.content}</Text>

        {/* Image Display */}
        {announcement.images && announcement.images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Attached Photos</Text>
            {announcement.images.map((img: string, index: number) => (
              <Image 
                key={index} 
                source={{ uri: img }} 
                style={styles.attachedImage} 
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 28,
    color: '#0f172a',
    lineHeight: 36,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  catIcon: {
    marginRight: 4,
  },
  categoryBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 13,
    color: '#64748b',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  authorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  authorSubtext: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: '#64748b',
  },
  contentBody: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 32,
  },
  imagesSection: {
    marginTop: 8,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 4,
  },
  attachedImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
});
