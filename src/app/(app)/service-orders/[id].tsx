import { ArrowLeft, Star } from 'lucide-react-native';


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { insforge } from '../../../lib/insforge';
import { useAuth } from '../../../contexts/AuthContext';

export default function ServiceOrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { handleAuthError } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error('Error fetching service order details:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    if (!rating) return <Text style={styles.detailValue}>Pending</Text>;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={20} color={i <= rating ? '#eab308' : '#cbd5e1'} strokeWidth={2} />
      );
    }
    return (
      <View style={styles.ratingRow}>
        {stars}
        <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Service order not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyles(order.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1193d4" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {order.status || 'Pending'}
            </Text>
          </View>
          <Text style={styles.orderIdText}>Order ID: {order.id.split('-')[0].toUpperCase()}</Text>
        </View>

        {/* Resident Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resident Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit Address</Text>
            <Text style={styles.detailValue}>{order.unit_address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Occupant Name</Text>
            <Text style={styles.detailValue}>{order.occupant_name}</Text>
          </View>
        </View>

        {/* Issue Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Description</Text>
          <Text style={styles.issueText}>{order.issue_description}</Text>
        </View>

        {/* Maintenance Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Info</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Maintenance Person</Text>
            <Text style={styles.detailValue}>{order.maintenance_person || 'Not Assigned'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Submitted</Text>
            <Text style={styles.detailValue}>{formatDateTime(order.created_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Complete on</Text>
            <Text style={styles.detailValue}>{formatDate(order.complete_on) || 'Not Scheduled'}</Text>
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution & Feedback</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Satisfaction Rating</Text>
            {renderStars(order.satisfaction_rating)}
          </View>
          <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
            <Text style={styles.detailLabel}>Resident Feedback</Text>
            <Text style={styles.feedbackText}>{order.feedback || 'No feedback provided yet.'}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  backLink: {
    padding: 10,
  },
  backLinkText: {
    color: '#1193d4',
    fontFamily: 'Manrope-Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
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
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderIdText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  issueText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  feedbackText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
});
