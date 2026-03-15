import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

function CustomHeader() {
  return (
    <SafeAreaView edges={['top']} style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="menu" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neighborhood Hub</Text>
        <TouchableOpacity>
          <MaterialIcons name="notifications" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AppLayout() {
  const { session, loading, userRole } = useAuth();

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

  return (
    <Tabs 
      screenOptions={{ 
        header: () => <CustomHeader />,
        tabBarActiveTintColor: '#1193d4',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#f6f7f8',
          borderTopColor: '#e2e8f0',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope-Medium',
          fontSize: 12,
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="messages" 
        options={{ 
          title: 'Messages',
          tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="events" 
        options={{ 
          title: 'Events',
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />
        }} 
      />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="forum" options={{ href: null }} />
      <Tabs.Screen name="voting" options={{ href: null }} />
      <Tabs.Screen name="grievances" options={{ href: null }} />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="service-orders" options={{ href: null }} />
      <Tabs.Screen name="classifieds" options={{ href: null }} />
      <Tabs.Screen name="members" options={{ href: null }} />
      
      {/* Admin Screen (Conditional) */}
      <Tabs.Screen 
        name="admin" 
        options={{ 
          title: 'Analytics',
          tabBarIcon: ({ color }) => <MaterialIcons name="analytics" size={24} color={color} />,
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
  }
});
