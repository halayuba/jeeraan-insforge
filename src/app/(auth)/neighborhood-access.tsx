import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { insforge } from '../../lib/insforge';

export default function NeighborhoodAccess() {
  const router = useRouter();
  
  // Section 1 State
  const [inviteCode, setInviteCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  // Section 2 State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmResidency, setConfirmResidency] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [neighborhood, setNeighborhood] = useState<any>(null); // MVP: Single active neighborhood
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(true);

  useEffect(() => {
    fetchNeighborhood();
  }, []);

  const fetchNeighborhood = async () => {
    try {
      const { data, error } = await insforge.database
        .from('neighborhoods')
        .select('*')
        .limit(1)
        .single();
        
      if (!error && data) {
        setNeighborhood(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNeighborhood(false);
    }
  };

  const handleJoinViaCode = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit invite code.');
      return;
    }
    
    setValidatingCode(true);
    // TODO: Connect edge function or validate directly from DB when invite code validation logic is fully specified
    // For now, allow mocked validation or direct DB check if policy allows it.
    try {
      const { data, error } = await insforge.database
        .from('invites')
        .select('*')
        .eq('code', inviteCode.toUpperCase())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Invalid or expired invite code.');
      } else {
        // Invite is valid! Direct to sign-up and pass the code
        // For MVP we just navigate to sign-up
        router.push({ pathname: '/(auth)/sign-up', params: { inviteCode: data.code, neighborhoodId: data.neighborhood_id } });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to validate invite code.');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!fullName || !phone) {
      Alert.alert('Error', 'Please enter both your full name and phone number.');
      return;
    }
    if (!neighborhood) {
      Alert.alert('Error', 'No neighborhood available to join.');
      return;
    }
    if (!confirmResidency) {
      Alert.alert('Error', 'You must confirm your residency to submit a request.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const { error } = await insforge.database
        .from('join_requests')
        .insert([{
          name: fullName,
          phone: phone,
          neighborhood_id: neighborhood.id,
          status: 'pending'
        }]);

      if (error) {
        Alert.alert('Error', 'Failed to submit request. Please try again.');
        console.error(error);
      } else {
        Alert.alert('Success', 'Your request has been submitted. The neighborhood admin will review it.');
        setFullName('');
        setPhone('');
        setConfirmResidency(false);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Neighborhood Access</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Section 1: Join via Invite Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join via Invite Code</Text>
            <Text style={styles.sectionSubtitle}>Enter the 6-digit code provided by your neighborhood administrator.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Invite Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="XXXXXX"
                placeholderTextColor="#94a3b8"
                maxLength={6}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, (!inviteCode || validatingCode) && styles.disabledButton]} 
              onPress={handleJoinViaCode}
              disabled={!inviteCode || validatingCode}
            >
              {validatingCode ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Join Neighborhood</Text>}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Section 2: Request to Join */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request to Join</Text>
            <Text style={styles.sectionSubtitle}>Don't have a code? Submit a request to your neighborhood board for verification.</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 000-0000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Neighborhood</Text>
                <View style={[styles.input, styles.readOnlyInput]}>
                  {loadingNeighborhood ? (
                    <ActivityIndicator size="small" color="#1193d4" />
                  ) : neighborhood ? (
                    <Text style={styles.readOnlyText}>{neighborhood.name}</Text>
                  ) : (
                    <Text style={styles.readOnlyText}>No active neighborhoods</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setConfirmResidency(!confirmResidency)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, confirmResidency && styles.checkboxChecked]}>
                  {confirmResidency && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm that I am a resident of the selected neighborhood above
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryButton, styles.submitButton, (!fullName || !phone || !confirmResidency || submittingRequest) && styles.disabledButton]} 
                onPress={handleRequestToJoin}
                disabled={!fullName || !phone || !confirmResidency || submittingRequest}
              >
                {submittingRequest ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit Request</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Entry */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Manrope-ExtraBold',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Manrope-SemiBold',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Manrope-Bold',
    letterSpacing: 8,
    height: 60,
  },
  readOnlyInput: {
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  readOnlyText: {
    color: '#475569',
    fontFamily: 'Manrope-Medium',
  },
  primaryButton: {
    backgroundColor: '#1193d4',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1193d4',
    borderColor: '#1193d4',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope-Medium',
    color: '#334155',
    lineHeight: 20,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    marginRight: 6,
  },
  signInLink: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
  }
});
