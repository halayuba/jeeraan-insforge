import React, { useState } from 'react';
import { Alert, ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { insforge } from '../../lib/insforge';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { JeeraanLogo } from '../../components/JeeraanLogo';
import { useToast } from '../../contexts/ToastContext';

export default function SignUp() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { inviteCode, neighborhoodId, phone } = useLocalSearchParams();

  React.useEffect(() => {
    if (!inviteCode) {
      console.warn('[SignUp] No inviteCode found, redirecting back...');
      Alert.alert('Access Restricted', 'You need a valid invite to create an account.');
      router.replace('/(auth)/neighborhood-access');
    } else {
      fetchPrePopulatedData();
    }
  }, [inviteCode]);

  const fetchPrePopulatedData = async () => {
    try {
      const actualPhone = Array.isArray(phone) ? phone[0] : phone;
      const actualCode = Array.isArray(inviteCode) ? inviteCode[0] : inviteCode;
      const actualNeighborhoodId = Array.isArray(neighborhoodId) ? neighborhoodId[0] : neighborhoodId;

      if (!actualPhone && !actualCode) return;

      // 1. Try by Invite Code + Neighborhood (Most reliable as invite_code is assigned specifically on approval)
      if (actualCode) {
        let query = insforge.database
          .from('join_requests')
          .select('name, email')
          .eq('invite_code', String(actualCode).toUpperCase());
        
        if (actualNeighborhoodId) {
          query = query.eq('neighborhood_id', actualNeighborhoodId);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        
        if (error) {
          console.error('[SignUp] Error querying by invite_code:', error);
        }

        if (data) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          return; // Success
        }
      }

      // 2. Fallback to Phone if no data found by invite code (e.g. if invite_code wasn't stored in join_requests)
      if (actualPhone) {
        let query = insforge.database
          .from('join_requests')
          .select('name, email')
          .eq('phone', actualPhone);

        if (actualNeighborhoodId) {
          query = query.eq('neighborhood_id', actualNeighborhoodId);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        
        if (error) {
          console.error('[SignUp] Error querying by phone:', error);
        }

        if (data) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          return;
        }

        // 3. If sanitized phone lookup failed, try to look for requests where phone contains the digits
        // This is a bit risky but can help if stored format is different (e.g. (555) 000-0000)
        const digitsOnly = actualPhone.replace(/\D/g, '');
        if (digitsOnly.length >= 10) {
          const last10 = digitsOnly.slice(-10);
          
          let fuzzyQuery = insforge.database
            .from('join_requests')
            .select('name, email')
            .ilike('phone', `%${last10}%`);
            
          if (actualNeighborhoodId) {
            fuzzyQuery = fuzzyQuery.eq('neighborhood_id', actualNeighborhoodId);
          }
          
          const { data: fuzzyData } = await fuzzyQuery.order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (fuzzyData) {
            if (fuzzyData.name) setName(fuzzyData.name);
            if (fuzzyData.email) setEmail(fuzzyData.email);
          }
        }
      }
    } catch (err) {
      console.error('[SignUp] Unexpected error fetching prepopulated data:', err);
    }
  };
  
  // States to manage the registration flow
  const [requiresVerification, setRequiresVerification] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
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
      router.replace('/(app)/hub');
    }
  };

  const linkUserToNeighborhood = async (userId: string) => {
    try {
      // 1. Ensure profile exists and has full name
      await insforge.database.from('user_profiles')
        .upsert({ 
          user_id: userId,
          full_name: name,
          updated_at: new Date().toISOString()
        });

      // 2. Link to neighborhood
      await insforge.database.from('user_neighborhoods').insert([{
        user_id: userId,
        neighborhood_id: neighborhoodId,
        role: 'resident'
      }]);

      // 3. Mark invite as used and award points to inviter
      const { data: inviteData } = await insforge.database.from('invites')
        .update({ used_at: new Date().toISOString() })
        .eq('code', String(inviteCode).toUpperCase())
        .eq('neighborhood_id', neighborhoodId)
        .select('created_by, phone, neighborhood_id')
        .single();

      if (inviteData) {
        // 4. Update join request status to completed
        await insforge.database.from('join_requests')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('phone', inviteData.phone)
          .eq('neighborhood_id', inviteData.neighborhood_id)
          .eq('status', 'approved');

        // 5. Notify the admin
        if (inviteData.created_by) {
          try {
            // Get neighborhood name
            const { data: nData } = await insforge.database
              .from('neighborhoods')
              .select('name')
              .eq('id', neighborhoodId)
              .single();

            await insforge.database.from('notifications').insert([{
              user_id: inviteData.created_by,
              title: 'New Member Joined',
              message: `${name} has successfully joined ${nData?.name || 'the neighborhood'}. They have been removed from the Approved tab and added to the Members tab.`,
              type: 'info'
            }]);
          } catch (notifErr) {
            console.error('Failed to create admin notification:', notifErr);
          }

          // Award points to the person who created the invite
          try {
            await insforge.functions.invoke('award-points-v1', {
              body: {
                userId: inviteData.created_by,
                actionType: 'invite_accepted',
                neighborhoodId: neighborhoodId,
                entityId: userId // The new user's ID is the entity
              }
            });
          } catch (rewardErr) {
            console.error('Failed to award invite points:', rewardErr);
          }
        }
      }
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
      router.replace('/(app)/hub');
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
      <View style={styles.logoContainer}>
        <JeeraanLogo width={180} height={60} />
      </View>
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 60,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: '#0f172a',
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
