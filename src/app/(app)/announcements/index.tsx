import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Megaphone,
  PlusCircle,
  Search,
  Shield,
  ShieldAlert,
  Wrench,
  User,
} from 'lucide-react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuthStore } from '../../../store/useAuthStore'
import { insforge } from '../../../lib/insforge'

const FILTER_OPTIONS = ['Year', 'Month', 'Category', 'Status']

export default function AnnouncementsIndex() {
  const router = useRouter()
  const { handleAuthError, neighborhoodId, userRole } = useAuthStore()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAnnouncements = async (isRefreshing = false) => {
    if (!neighborhoodId) return;
    if (isRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      let query = insforge.database
        .from('announcements')
        .select(`
          *,
          author:user_profiles(full_name, is_visible, anonymous_id)
        `)
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        handleAuthError(error)
        return
      }

      const formatted = (data || []).map((a: any) => ({
        ...a,
        author: Array.isArray(a.author) ? a.author[0] : a.author
      }));
      setAnnouncements(formatted)
    } catch (err) {
      console.error('Error fetching announcements:', err)
      handleAuthError(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements()
    }, []),
  )

  const getCategoryStyles = (category: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('safety')) return { bg: '#ffedd5', text: '#ea580c' } // orange
    if (cat.includes('security')) return { bg: '#dbeafe', text: '#2563eb' } // blue
    if (cat.includes('events')) return { bg: '#dcfce7', text: '#16a34a' } // green
    if (cat.includes('maintenance')) return { bg: '#f3e8ff', text: '#9333ea' } // purple
    return { bg: '#f1f5f9', text: '#475569' } // default slate
  }

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('safety')) return ShieldAlert
    if (cat.includes('security')) return Shield
    if (cat.includes('events')) return Calendar
    if (cat.includes('maintenance')) return Wrench
    return Megaphone
  }

  const formatAnnouncementDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Within last 24 hours
    if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Yesterday
    if (diff < 48 * 60 * 60 * 1000 && now.getDate() - 1 === date.getDate()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    }

    // Older
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Filter based on search query
  const filteredAnnouncements = announcements.filter(
    (a) =>
      (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.content || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Announcements</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/announcements/create' as any)}
          style={styles.iconButton}
        >
          <PlusCircle size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search
            size={24}
            color="#64748b"
            style={styles.searchIcon}
            strokeWidth={2}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity key={filter} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{filter}</Text>
              <ChevronDown size={18} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAnnouncements(true)}
          />
        }
      >
        <Text style={styles.sectionHeading}>Current Month</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1193d4"
            style={styles.loader}
          />
        ) : filteredAnnouncements.length === 0 ? (
          <Text style={styles.emptyText}>No announcements found.</Text>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const catStyles = getCategoryStyles(announcement.category)
            const CategoryIcon = getCategoryIcon(announcement.category)

            return (
              <TouchableOpacity
                key={announcement.id}
                style={styles.card}
                onPress={() =>
                  router.push(`/(app)/announcements/${announcement.id}` as any)
                }
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: catStyles.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: catStyles.text },
                      ]}
                    >
                      {announcement.category}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    {announcement.status === 'pending' && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                    )}
                    <Text style={styles.timeText}>
                      {formatAnnouncementDate(announcement.created_at)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{announcement.title}</Text>
                <Text style={styles.cardContent} numberOfLines={2}>
                  {announcement.content}
                </Text>

                {/* If the announcement has images, show the first one as a cover */}
                {announcement.images && announcement.images.length > 0 && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: announcement.images[0] }}
                      style={styles.imagePreview}
                    />
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <View style={styles.authorContainer}>
                    <View style={styles.authorIconContainer}>
                      <User size={14} color="#1193d4" strokeWidth={2} />
                    </View>
                    <Text style={styles.authorName}>
                      {announcement.author?.full_name || 'Admin Team'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.readMoreText}>Read More</Text>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
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
    padding: 16,
    backgroundColor: '#ffffff',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
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
  filtersWrapper: {
    backgroundColor: '#ffffff',
    paddingBottom: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterChipText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Pad for FAB
  },
  sectionHeading: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 16,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    fontFamily: 'Manrope-Medium',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pendingBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  cardTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  cardContent: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    height: 140,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#334155',
  },
  readMoreText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
  },
})
