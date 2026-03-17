import React, { useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';

const FILTER_OPTIONS = ['Year', 'Month', 'Rating'];

export default function ServiceOrdersIndex() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching service orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.unit_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.occupant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.issue_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'in progress':
        return { bg: 'rgba(17, 147, 212, 0.1)', text: '#1193d4' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default: // Pending
        return { bg: '#fef3c7', text: '#b45309' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    if (!rating) {
      return <Text style={styles.pendingRatingText}>Rating pending</Text>;
    }
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name="star"
          size={18}
          color={i <= rating ? '#eab308' : '#cbd5e1'}
        />
      );
    }
    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1193d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Orders</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/service-orders/submit' as any)}
          style={styles.iconButton}
        >
          <MaterialIcons name="add-circle" size={24} color="#1193d4" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search unit or occupant"
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
            <TouchableOpacity key={filter} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{filter}</Text>
              <MaterialIcons name="expand-more" size={20} color="#0f172a" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeading}>Recent Orders</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 32 }} />
        ) : filteredOrders.length === 0 ? (
          <Text style={styles.emptyText}>No service orders found.</Text>
        ) : (
          filteredOrders.map((order) => {
            const statusStyle = getStatusStyles(order.status);
            return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.card}
                onPress={() => router.push(`/(app)/service-orders/${order.id}` as any)}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.unitNameText}>
                      {order.unit_address} - {order.occupant_name}
                    </Text>
                    <Text style={styles.descriptionText} numberOfLines={1}>
                      {order.issue_description}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                      {order.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <View>{renderStars(order.satisfaction_rating)}</View>
                  <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
                </View>

                {order.status === 'Cancelled' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.pendingRatingText, { fontStyle: 'italic' }]}>
                      User requested cancellation
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
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
    marginLeft: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    color: '#334155',
  },
  scrollContainer: {
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  unitNameText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1193d4',
    marginBottom: 2,
  },
  descriptionText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingScore: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  pendingRatingText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
