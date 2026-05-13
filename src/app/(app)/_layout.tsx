import { BarChart3, Bell, HelpCircle, Home, Menu, User, X, ArrowLeft } from 'lucide-react-native';
import { IconInfoSquareRounded, IconSquareRoundedPlusFilled } from '@tabler/icons-react-native';
import { Tabs, useSegments, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LevelBadge } from '../../components/LevelBadge';
import { insforge } from '../../lib/insforge';

function CustomHeader() {
  const { userLevel, userRole, globalRole } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [featureInfo, setFeatureInfo] = useState<{title: string, summary: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('Neighborhood Hub');

  const lastSegment = segments[segments.length - 1];
  let featureKey = lastSegment === '(app)' ? 'hub' : lastSegment;
  if (featureKey?.startsWith('[') || !featureKey) {
    featureKey = segments[segments.length - 2] || 'hub';
  }

  // Define screens that show the PLUS icon and their destination routes
  const PLUS_ACTIONS: Record<string, string> = {
    'messages': '/(app)/messages?new=true',
    'events': '/(app)/events/create',
    'service-orders': '/(app)/service-orders/submit',
    'forum': '/(app)/forum/create',
    'classifieds': '/(app)/classifieds/create',
    'grievances': '/(app)/grievances/submit',
    'gallery': '/(app)/gallery/upload',
    'q-and-a': '/(app)/q-and-a/submit'
  };

  const isSubPage = segments.some(s => ['create', 'submit', 'upload', '[id]', 'details'].includes(s) || s.match(/^[0-9a-f]{8}-/));
  const showPlusIcon = !isSubPage && !!PLUS_ACTIONS[featureKey];

  useEffect(() => {
    const updateHeaderTitle = async () => {
      if (featureKey === 'profile' || featureKey === 'faq' || featureKey === 'hub') {
        setHeaderTitle('Neighborhood Hub');
        return;
      }

      try {
        const { data, error } = await insforge.database
          .from('feature_info')
          .select('title')
          .eq('feature_key', featureKey)
          .maybeSingle();

        if (data?.title) {
          let title = data.title;
          if (featureKey === 'q-and-a' || title.toLowerCase() === 'q & a') {
            title = 'Q & A';
          }
          setHeaderTitle(title);
        } else {
          // Fallback to title-cased key if not found in table
          let capitalized = featureKey.charAt(0).toUpperCase() + featureKey.slice(1).replace(/-/g, ' ');
          // Special case for Q&A
          if (featureKey === 'q-and-a') capitalized = 'Q & A';
          setHeaderTitle(capitalized);
        }
      } catch (err) {
        setHeaderTitle('Neighborhood Hub');
      }
    };

    updateHeaderTitle();
  }, [featureKey]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/hub');
    }
  };

  const handlePlusPress = () => {
    const route = PLUS_ACTIONS[featureKey];
    if (route) {
      router.push(route as any);
    }
  };

  const handleInfoPress = async () => {
    setModalVisible(true);
    setLoading(true);
    
    // Special cases
    let infoKey = featureKey;
    if (infoKey === 'profile' || infoKey === 'faq') infoKey = 'hub';

    try {
      const { data, error } = await insforge.database
        .from('feature_info')
        .select('title, summary')
        .eq('feature_key', infoKey)
        .maybeSingle();

      if (error) throw error;
      setFeatureInfo(data || { title: 'Information', summary: 'Information for this feature is coming soon!' });
    } catch (err) {
      console.error('Failed to fetch feature info:', err);
      setFeatureInfo({ title: 'Error', summary: 'Failed to load feature information.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <ArrowLeft size={28} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          {/* LevelBadge is only for residents and moderators */}
          {(userRole === 'resident' || userRole === 'moderator') && globalRole !== 'super_admin' && (
            <LevelBadge level={userLevel} size="small" />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {showPlusIcon && (
            <TouchableOpacity onPress={handlePlusPress}>
              <IconSquareRoundedPlusFilled size={30} color="#1193d4" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleInfoPress}>
            <IconInfoSquareRounded size={28} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{featureInfo?.title || 'Information'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {loading ? (
                <ActivityIndicator size="large" color="#1193d4" style={{ marginTop: 20 }} />
              ) : (
                <Text style={styles.modalSummary}>{featureInfo?.summary}</Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function AppLayout() {
  const { session, loading, isInitialized, userRole, globalRole, neighborhoodId, isBlocked } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  if (!isInitialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f7f8' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  return (
    <Tabs 
      screenOptions={{ 
        header: () => <CustomHeader />,
        tabBarActiveTintColor: '#1193d4',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#f6f7f8',
          borderTopColor: '#cbd5e1',
          paddingBottom: 12,
          height: 75,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}
    >
      <Tabs.Screen 
        name="hub" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />
        }} 
      />
      <Tabs.Screen 
        name="faq" 
        options={{ 
          title: 'FAQ',
          tabBarIcon: ({ color }) => <HelpCircle size={24} color={color} strokeWidth={2} />
        }} 
      />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="q-and-a" options={{ href: null }} />
      <Tabs.Screen name="forum" options={{ href: null }} />
      <Tabs.Screen name="voting" options={{ href: null }} />
      <Tabs.Screen name="grievances" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="service-orders" options={{ href: null }} />
      <Tabs.Screen name="classifieds" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      <Tabs.Screen name="invites" options={{ href: null }} />
      <Tabs.Screen name="blocked" options={{ href: null }} />
      <Tabs.Screen name="whiteboard" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
      
      {/* Admin Screen (Conditional) */}
      <Tabs.Screen 
        name="admin" 
        options={{ 
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} strokeWidth={2} />,
          href: ((userRole === 'admin' || userRole === 'super_admin') ? '/admin' : null) as any
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#f6f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalSummary: {
    fontSize: 16,
    fontFamily: 'Manrope-Medium',
    color: '#334155',
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#1193d4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  }
});
