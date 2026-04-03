import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

const FILTER_OPTIONS = ['All', 'Pending', 'Resolved', 'In Progress'];

export default function GrievancesIndex() {
  const router = useRouter();
  const { handleAuthError } = useAuth();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchGrievances();
    }, [activeFilter])
  );

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      let query = insforge.database
        .from('grievances')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeFilter !== 'All') {
        query = query.eq('status', activeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setGrievances(data || []);
    } catch (err) {
      console.error('Error fetching grievances:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return '#22c55e'; // green-500
      case 'in progress':
        return '#3b82f6'; // blue-500
      case 'pending':
      default:
        return '#f97316'; // orange-500
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grievances</Text>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/(app)/grievances/submit' as any)}
        >
          <MaterialIcons name="add-circle" size={24} color="#1193d4" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.actionContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search grievances..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter ? styles.filterChipActive : styles.filterChipInactive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === filter ? styles.filterChipTextActive : styles.filterChipTextInactive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#1193d4" style={styles.loader} />
      ) : (
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {grievances.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map((grievance) => (
            <View key={grievance.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{grievance.title}</Text>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(grievance.status) }]} />
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {grievance.users?.username || 'Resident'} • {formatDate(grievance.created_at)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.cardStats}>
                  <TouchableOpacity style={styles.cardStat}>
                    <MaterialIcons name="chat-bubble" size={20} color="#64748b" />
                    <Text style={styles.cardStatText}>Comments</Text>
                  </TouchableOpacity>
                  <View style={styles.cardStat}>
                    <MaterialIcons name="visibility" size={20} color="#64748b" />
                    <Text style={styles.cardStatText}>{grievance.views_count} Views</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push(`/(app)/grievances/${grievance.id}` as any)}>
                  <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
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
  filtersWrapper: {
    paddingBottom: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1193d4',
  },
  filterChipInactive: {
    backgroundColor: '#f1f5f9',
  },
  filterChipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextInactive: {
    color: '#475569',
  },
  loader: {
    marginTop: 32,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  cardSubtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    marginTop: 12,
    paddingTop: 12,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardStatText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#64748b',
  },
  viewDetailsText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#1193d4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
