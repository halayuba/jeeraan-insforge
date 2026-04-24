import { ArrowLeft } from 'lucide-react-native';


import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { insforge } from '../../lib/insforge';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';

export default function CreateNeighborhoodScreen() {
  const router = useRouter();
  const { refreshAuth, session } = useAuthStore();
  
  const [step, setStep] = useState(session ? 2 : 1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: Neighborhood
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  React.useEffect(() => {
    if (session) {
      setStep(2);
    }
  }, [session]);

  const handleCreateAccount = async () => {
    if (!email || !password || !fullName || !phone) {
      Alert.alert('Error', 'Please fill out all account fields.');
      return;
    }

    setLoading(true);
    // Note: We register the user first, then they have a session to create the neighborhood
    const { data: authData, error: authError } = await insforge.auth.signUp({
      email,
      password,
      name: fullName,
    });

    setLoading(false);

    if (authError) {
      Alert.alert('Registration Error', authError.message);
      return;
    }
    
    // Auth successful! Move to neighborhood setup
    // Ensure the auth context reflects the user immediately
    await refreshAuth();
    setStep(2);
  };

  const handleSetupNeighborhood = async () => {
    if (!neighborhoodName || !address || !city || !state || !zipCode) {
      Alert.alert('Error', 'Please fill out all neighborhood fields.');
      return;
    }

    setLoading(true);
    
    // 1. Create the neighborhood record
    const { data: nData, error: nError } = await insforge.database
      .from('neighborhoods')
      .insert([{
        name: neighborhoodName,
        address: address,
        city: city,
        state: state,
        zip_code: zipCode
      }])
      .select('id')
      .single();

    if (nError) {
      setLoading(false);
      Alert.alert('Database Error', 'Could not create neighborhood: ' + nError.message);
      return;
    }

    const newNeighborhoodId = nData.id;

    const { data: sessionData } = await insforge.auth.getCurrentSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setLoading(false);
      Alert.alert('Error', 'User session not found.');
      return;
    }

    // 2. Update profile with full name if it was provided in step 1 or session
    // For existing super admins, we use fullName if they provided it, or skip
    if (fullName) {
      await insforge.database.from('user_profiles')
        .update({ full_name: fullName })
        .eq('user_id', userId);
    }

    // 3. Link the user to the new neighborhood as 'admin'
    const { error: linkError } = await insforge.database
      .from('user_neighborhoods')
      .insert([{
        user_id: userId,
        neighborhood_id: newNeighborhoodId,
        role: 'admin'
      }]);

    if (linkError) {
      setLoading(false);
      Alert.alert('Database Error', 'Could not assign admin role: ' + linkError.message);
      return;
    }

    // Done! Refresh the context (to get userRole) and redirect to app
    await refreshAuth();
    setLoading(false);
    Alert.alert('Success', 'Neighborhood created successfully!', [
      { text: 'Enter', onPress: () => router.replace('/(app)') }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Start a Community</Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Step 1: Create your admin account' : 'Step 2: Neighborhood Details'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="admin@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Secure password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleCreateAccount} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Neighborhood Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sunnyvale Estates"
                  value={neighborhoodName}
                  onChangeText={setNeighborhoodName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street Address or Area Cross-streets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123 Main St area"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={{flexDirection: 'row', gap: 16}}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.label}>State/Province</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12345"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSetupNeighborhood} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit & Enter</Text>}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    color: '#64748b',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#1193d4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#fff',
  },
});
