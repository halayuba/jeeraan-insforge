import { ArrowLeft, Calendar, Clock, MapPin, PlusCircle, Search } from 'lucide-react-native';


import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';

const TABS = ['Upcoming', 'Past', 'Ongoing'];

export default function EventsIndex() {
  const router = useRouter();
  const { refreshAuth, handleAuthError } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Upcoming');

  const fetchEvents = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      let query = insforge.database
        .from('events')
        .select('*')
        .order('event_datetime', { ascending: activeTab !== 'Past' });

      // Apply initial status filtering to align with the active tab.
      if (activeTab === 'Upcoming') {
        query = query.eq('status', 'Upcoming');
      } else if (activeTab === 'Past') {
        query = query.eq('status', 'Past');
      } else if (activeTab === 'Ongoing') {
        query = query.eq('status', 'Ongoing');
      }

      const { data, error } = await query;
      if (error) {
        handleAuthError(error);
        throw error;
      }
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [activeTab])
  );

  const filteredEvents = events.filter(
    (ev) =>
      ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatEventDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(app)/events/create' as any)}
          style={styles.iconButton}
        >
          <PlusCircle size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />
        }
      >
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={24} color="#94a3b8" style={styles.searchIcon} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[
                styles.tabChip, 
                activeTab === tab && styles.tabChipActive
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                activeTab === tab && styles.tabTextActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events Feed */}
        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events match your criteria.</Text>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map(ev => (
              <View key={ev.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{ev.title}</Text>
                
                <View style={styles.cardDetailRow}>
                  <Calendar size={18} color="#1193d4" style={styles.detailIcon} strokeWidth={2} />
                  <Text style={styles.detailTextBold}>{formatEventDate(ev.event_datetime)}</Text>
                </View>

                <View style={styles.cardDetailRow}>
                  <Clock size={18} color="#1193d4" style={styles.detailIcon} strokeWidth={2} />
                  <Text style={styles.detailTextBold}>{formatEventTime(ev.event_datetime)}</Text>
                </View>

                <View style={styles.cardDetailRow}>
                  <MapPin size={18} color="#1193d4" style={styles.detailIcon} strokeWidth={2} />
                  <Text style={styles.detailTextLight}>Organized by <Text style={{ color: '#0f172a', fontFamily: 'Manrope-Medium' }}>{ev.organizer}</Text></Text>
                </View>
                
                {ev.venue ? (
                  <View style={styles.cardDetailRow}>
                    <MapPin size={18} color="#1193d4" style={styles.detailIcon} strokeWidth={2} />
                    <Text style={styles.detailTextLight}>{ev.venue}</Text>
                  </View>
                ) : null}
              </View>
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
    backgroundColor: '#f6f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#0f172a',
  },
  tabsContainer: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 16,
  },
  tabChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabChipActive: {
    backgroundColor: '#1193d4',
    borderColor: '#1193d4',
  },
  tabText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailTextBold: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#334155',
  },
  detailTextLight: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#475569',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#64748b',
    marginTop: 40,
  },
});
