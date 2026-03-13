import React, { useState } from 'react';
import { Alert, ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { insforge } from '../../lib/insforge';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUp() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { inviteCode, neighborhoodId } = useLocalSearchParams();

  React.useEffect(() => {
    if (!inviteCode) {
      Alert.alert('Access Restricted', 'You need a valid invite to create an account.');
      router.replace('/(auth)/neighborhood-access');
    }
  }, [inviteCode]);
  
  // States to manage the registration flow
  const [requiresVerification, setRequiresVerification] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (data?.requireEmailVerification) {
      // API requires us to verify the email via OTP
      setRequiresVerification(true);
    } else if (data?.accessToken) {
      // User signed up and successfully authenticated right away
      const userId = data?.user?.id;
      if (userId && neighborhoodId) {
        await linkUserToNeighborhood(userId);
      }
      await refreshAuth();
      router.replace('/(app)');
    }
  };

  const linkUserToNeighborhood = async (userId: string) => {
    try {
      await insforge.database.from('user_neighborhoods').insert([{
        user_id: userId,
        neighborhood_id: neighborhoodId,
        role: 'resident'
      }]);
      await insforge.database.from('invites')
        .update({ used_at: new Date().toISOString() })
        .eq('code', inviteCode);
    } catch (err) {
      console.error('Failed to link neighborhood:', err);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }

    setLoading(true);
    const { data, error } = await insforge.auth.verifyEmail({
      email,
      otp,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Verification Error', error.message);
    } else {
      // Session automatically saved, redirect to the app
      const userId = data?.user?.id;
      if (userId && neighborhoodId) {
        await linkUserToNeighborhood(userId);
      }
      await refreshAuth();
      router.replace('/(app)');
    }
  };

  if (requiresVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
  },
  button: {
    backgroundColor: '#1193d4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Manrope-Regular',
    color: '#666',
  },
  link: {
    fontFamily: 'Manrope-SemiBold',
    color: '#1193d4',
  },
});
