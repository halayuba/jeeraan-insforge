import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { insforge } from '../../lib/insforge';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { JeeraanLogo } from '../../components/JeeraanLogo';

export default function SignIn() {
  const { refreshAuth } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone number and password.');
      return;
    }

    setLoading(true);
    // Passing phone number to the email field as InsForge treats it as an identifier
    const { error } = await insforge.auth.signInWithPassword({
      email: phone,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Error', error.message);
    } else {
      await refreshAuth();
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    const { data, error } = await insforge.auth.signInWithOAuth({
      provider,
      redirectTo: 'http://localhost:8081/(app)' // Needs proper deep linking configuration based on environment later
    });

    if (error) {
      Alert.alert('OAuth Error', error.message);
    } 
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <JeeraanLogo width={180} height={60} />
      </View>
      <Text style={styles.title}>Welcome Back</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 000-0000"
          autoCapitalize="none"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
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
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={() => handleOAuth('google')}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.facebookButton]} 
        onPress={() => handleOAuth('facebook')}
      >
        <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign Up</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontFamily: 'Manrope-Regular',
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  facebookButtonText: {
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
