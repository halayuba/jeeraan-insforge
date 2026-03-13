import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { insforge } from '../../lib/insforge';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, refreshAuth } = useAuth();

  const handleSignOut = async () => {
    await insforge.auth.signOut();
    await refreshAuth();
    router.replace('/(auth)/sign-in');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      <Text style={styles.text}>{session?.user?.email}</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignOut}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f7f8',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
})
