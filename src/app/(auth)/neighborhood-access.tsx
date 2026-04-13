import { ArrowLeft, Check, ChevronDown, ChevronUp, Key, UserPlus } from 'lucide-react-native';

import { Link, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { insforge } from '../../lib/insforge'

export default function NeighborhoodAccess() {
  const router = useRouter()

  // Accordion State
  const [expandedSection, setExpandedSection] = useState<
    'invite' | 'request' | null
  >(null)

  // Section 1 State
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)

  // Section 2 State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [confirmResidency, setConfirmResidency] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [neighborhood, setNeighborhood] = useState<any>(null) // MVP: Single active neighborhood
  const [loadingNeighborhood, setLoadingNeighborhood] = useState(true)

  useEffect(() => {
    fetchNeighborhood()
  }, [])

  const fetchNeighborhood = async () => {
    try {
      const { data, error } = await insforge.database
        .from('neighborhoods')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        setNeighborhood(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNeighborhood(false)
    }
  }

  const toggleSection = (section: 'invite' | 'request') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleJoinViaCode = async () => {
    if (!invitePhone || !inviteCode || inviteCode.length !== 6) {
      Alert.alert('Invalid Input', 'Please enter both your phone number and the 6-digit invite code.')
      return
    }

    setValidatingCode(true)
    try {
      // Call the Edge Function to validate the invite
      const { data, error } = await insforge.functions.invoke('validate-invite', {
        body: { 
          code: inviteCode.toUpperCase(),
          phone: invitePhone
        }
      })

      if (error || !data || !data.success) {
        Alert.alert('Error', error?.message || data?.error || 'Invalid or expired invite code.')
      } else {
        // Invite is valid! Direct to sign-up and pass the code
        Alert.alert('Success', 'Invite code verified. Please set your password to continue.')
        router.push({
          pathname: '/(auth)/sign-up',
          params: {
            inviteCode: data.invite.code || inviteCode.toUpperCase(),
            phone: invitePhone,
            neighborhoodId: data.invite.neighborhood_id,
          },
        })
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to validate invite code.')
    } finally {
      setValidatingCode(false)
    }
  }

  const handleRequestToJoin = async () => {
    if (!fullName || !phone || !address) {
      Alert.alert('Error', 'Please enter your full name, phone number, and address.')
      return
    }
    if (!neighborhood) {
      Alert.alert('Error', 'No neighborhood available to join.')
      return
    }
    if (!confirmResidency) {
      Alert.alert(
        'Error',
        'You must confirm your residency to submit a request.',
      )
      return
    }

    setSubmittingRequest(true)
    try {
      const { error } = await insforge.database.from('join_requests').insert([
        {
          name: fullName,
          phone: phone,
          address: address,
          neighborhood_id: neighborhood.id,
          status: 'pending',
        },
      ])

      if (error) {
        Alert.alert('Error', 'Failed to submit request. Please try again.')
        console.error(error)
      } else {
        Alert.alert(
          'Success',
          'Your request has been submitted. The neighborhood admin will review it.',
        )
        setFullName('')
        setPhone('')
        setAddress('')
        setConfirmResidency(false)
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#0f172a" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Neighborhood Access</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Prominent Sign In Section */}
          <View style={styles.prominentSignIn}>
            <Text style={styles.signInTitle}>Welcome Back</Text>
            <Text style={styles.signInSubtitle}>
              Already a resident? Sign in to your neighborhood portal.
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.signInLargeButton}>
                <Text style={styles.signInLargeButtonText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.accordionContainer}>
            {/* Section 1: Join via Invite Code */}
            <TouchableOpacity
              style={[
                styles.accordionHeader,
                expandedSection === 'invite' && styles.accordionHeaderActive,
              ]}
              onPress={() => toggleSection('invite')}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleContainer}>
                <Key
                  size={24}
                  color={expandedSection === 'invite' ? '#1193d4' : '#64748b'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.accordionTitle,
                    expandedSection === 'invite' && styles.accordionTitleActive,
                  ]}
                >
                  Join via Invite Code
                </Text>
              </View>
              {expandedSection === 'invite' ? (
                <ChevronUp size={28} color="#64748b" strokeWidth={2} />
              ) : (
                <ChevronDown size={28} color="#64748b" strokeWidth={2} />
              )}
            </TouchableOpacity>

            {expandedSection === 'invite' && (
              <View style={styles.accordionContent}>
                <Text style={styles.sectionSubtitle}>
                  If you received a one-time invitation code from your
                  neighborhood administrator at the phone number you provided,
                  please enter it below to proceed with joining your
                  neighborhood.
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(555) 000-0000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={invitePhone}
                    onChangeText={setInvitePhone}
                  />
                </View>

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
                  style={[
                    styles.primaryButton,
                    (!inviteCode || !invitePhone || validatingCode) && styles.disabledButton,
                  ]}
                  onPress={handleJoinViaCode}
                  disabled={!inviteCode || !invitePhone || validatingCode}
                >
                  {validatingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Section 2: Request to Join */}
            <TouchableOpacity
              style={[
                styles.accordionHeader,
                expandedSection === 'request' && styles.accordionHeaderActive,
                { marginTop: 12 },
              ]}
              onPress={() => toggleSection('request')}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleContainer}>
                <UserPlus size={24} color={expandedSection === 'request' ? '#1193d4' : '#64748b'} strokeWidth={2} />
                <Text
                  style={[
                    styles.accordionTitle,
                    expandedSection === 'request' &&
                      styles.accordionTitleActive,
                  ]}
                >
                  Request to Join
                </Text>
              </View>
              {expandedSection === 'request' ? (
                <ChevronUp size={28} color="#64748b" strokeWidth={2} />
              ) : (
                <ChevronDown size={28} color="#64748b" strokeWidth={2} />
              )}
            </TouchableOpacity>

            {expandedSection === 'request' && (
              <View style={styles.accordionContent}>
                <Text style={styles.sectionSubtitle}>
                  Would you like to join your neighborhood but don't have a code
                  yet? Submit a request to your neighborhood admin for
                  verification. (Note: Your information is required for
                  verification and will never be shared with anyone.)
                </Text>

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
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123 Neighborhood St"
                      placeholderTextColor="#94a3b8"
                      value={address}
                      onChangeText={setAddress}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Select Neighborhood</Text>
                    <View style={[styles.input, styles.readOnlyInput]}>
                      {loadingNeighborhood ? (
                        <ActivityIndicator size="small" color="#1193d4" />
                      ) : neighborhood ? (
                        <Text style={styles.readOnlyText}>
                          {neighborhood.name}
                        </Text>
                      ) : (
                        <Text style={styles.readOnlyText}>
                          No active neighborhoods
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setConfirmResidency(!confirmResidency)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        confirmResidency && styles.checkboxChecked,
                      ]}
                    >
                      {confirmResidency && (
                        <Check size={16} color="#fff" strokeWidth={2} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I confirm that I am a resident of the selected
                      neighborhood above
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.submitButton,
                      (!fullName ||
                        !phone ||
                        !address ||
                        !confirmResidency ||
                        submittingRequest) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleRequestToJoin}
                    disabled={
                      !fullName ||
                      !phone ||
                      !address ||
                      !confirmResidency ||
                      submittingRequest
                    }
                  >
                    {submittingRequest ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Submit Request
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
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
  prominentSignIn: {
    padding: 24,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    gap: 8,
  },
  signInTitle: {
    fontSize: 22,
    fontFamily: 'Manrope-ExtraBold',
    color: '#0f172a',
  },
  signInSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  signInLargeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1193d4',
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 24,
  },
  signInLargeButtonText: {
    color: '#1193d4',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
  accordionContainer: {
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  accordionHeaderActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#1193d4',
    backgroundColor: 'rgba(17, 147, 212, 0.02)',
  },
  accordionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#475569',
  },
  accordionTitleActive: {
    color: '#1193d4',
  },
  accordionContent: {
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#1193d4',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    color: '#64748b',
    marginBottom: 20,
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
})
