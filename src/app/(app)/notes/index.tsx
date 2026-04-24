import {
  ArrowLeft,
  FileText,
} from 'lucide-react-native'

import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuthStore } from '../../../store/useAuthStore'
import { insforge } from '../../../lib/insforge'

export default function NotesIndex() {
  const router = useRouter()
  const { handleAuthError, neighborhoodId } = useAuthStore()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotes = async (isRefreshing = false) => {
    if (!neighborhoodId) return;
    if (isRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const { data, error } = await insforge.database
        .from('neighborhood_notes')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .order('created_at', { ascending: false });

      if (error) {
        handleAuthError(error)
        return
      }

      setNotes(data || [])
    } catch (err) {
      console.error('Error fetching notes:', err)
      handleAuthError(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchNotes()
    }, [neighborhoodId]),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

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
        <Text style={styles.headerTitle}>Neighborhood Notes</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotes(true)}
          />
        }
      >
        <Text style={styles.subtitle}>
          Important documents, meeting minutes, and reports shared by your neighborhood admins.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1193d4"
            style={styles.loader}
          />
        ) : notes.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#cbd5e1" strokeWidth={1} />
            <Text style={styles.emptyText}>No notes found.</Text>
            <Text style={styles.emptySubtext}>Check back later for updates from your board.</Text>
          </View>
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
              </View>
              <Text style={styles.noteMessage}>{note.message}</Text>
            </View>
          ))
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#94a3b8',
  },
  emptySubtext: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteDate: {
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    color: '#94a3b8',
  },
  noteTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  noteMessage: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
})
