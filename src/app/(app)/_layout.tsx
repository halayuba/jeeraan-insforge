import { BarChart3, Bell, HelpCircle, Home, Menu, User } from 'lucide-react-native';


import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LevelBadge } from '../../components/LevelBadge';

function CustomHeader() {
  const { userLevel } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Menu size={28} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Neighborhood Hub</Text>
          <LevelBadge level={userLevel} size="small" />
        </View>
        <TouchableOpacity>
          <Bell size={28} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AppLayout() {
  const { session, loading, userRole, globalRole, neighborhoodId } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1193d4" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If super admin has no neighborhood, they must create or join one
  if (globalRole === 'super_admin' && !neighborhoodId) {
    return <Redirect href="/(auth)/create-neighborhood" />;
  }

  return (
    <Tabs 
      screenOptions={{ 
        header: () => <CustomHeader />,
        tabBarActiveTintColor: '#1193d4',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#f6f7f8',
          borderTopColor: '#e2e8f0',
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
        name="index" 
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
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="q-and-a" options={{ href: null }} />
      <Tabs.Screen name="advertisements" options={{ href: null }} />
      <Tabs.Screen name="forum" options={{ href: null }} />
      <Tabs.Screen name="voting" options={{ href: null }} />
      <Tabs.Screen name="grievances" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="service-orders" options={{ href: null }} />
      <Tabs.Screen name="classifieds" options={{ href: null }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      <Tabs.Screen name="invites" options={{ href: null }} />
      
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
  }
});
