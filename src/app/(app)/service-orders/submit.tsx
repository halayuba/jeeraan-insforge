import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { insforge } from '../../../lib/insforge';

export default function SubmitServiceOrder() {
  const router = useRouter();
  
  const [unitAddress, setUnitAddress] = useState('');
  const [occupantName, setOccupantName] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [maintenancePerson, setMaintenancePerson] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!unitAddress.trim() || !occupantName.trim() || !issueDescription.trim()) {
      Alert.alert('Validation Error', 'Please complete the Unit Address, Occupant Name, and Details fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Not authenticated');

      const { error } = await insforge.database
        .from('service_orders')
        .insert([{
          user_id: userData.user.id,
          unit_address: unitAddress.trim(),
          occupant_name: occupantName.trim(),
          issue_description: issueDescription.trim(),
          maintenance_person: maintenancePerson || null,
          preferred_date: preferredDate || null,
          satisfaction_rating: satisfaction > 0 ? satisfaction : null,
          status: 'Pending',
        }]);

      if (error) throw error;
      
      Alert.alert('Success', 'Service order requested successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message || 'Failed to submit service order.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const isSelected = index <= satisfaction;
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.starButton}
        onPress={() => setSatisfaction(index)}
      >
        <MaterialIcons 
          name="star" 
          size={24} 
          color={isSelected ? '#eab308' : '#cbd5e1'} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Service Order</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="more-vert" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Resident Details */}
        <Text style={styles.sectionTitle}>RESIDENT DETAILS</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Unit Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apt 4B, Sunset Towers"
              placeholderTextColor="#94a3b8"
              value={unitAddress}
              onChangeText={setUnitAddress}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name of Occupant</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              value={occupantName}
              onChangeText={setOccupantName}
            />
          </View>
        </View>

        {/* Issue Description */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>ISSUE DESCRIPTION</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Details of the Issue</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the maintenance problem in detail..."
            placeholderTextColor="#94a3b8"
            value={issueDescription}
            onChangeText={setIssueDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.inputGroupRow}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>Maintenance Person <Text style={styles.optional}>(Optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Smith"
              placeholderTextColor="#94a3b8"
              value={maintenancePerson}
              onChangeText={setMaintenancePerson}
            />
          </View>
          
          <View style={[styles.inputContainer, { flex: 1.2 }]}>
            <Text style={styles.label}>Satisfaction <Text style={styles.optional}>(Pre-fill)</Text></Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(renderStar)}
            </View>
          </View>
        </View>

        {/* Scheduling */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>SCHEDULING</Text>
        <View style={styles.inputGroupRow}>
          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>Date Submitted</Text>
            <View style={styles.readOnlyInputContainer}>
              <MaterialIcons name="calendar-today" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.readOnlyInput}
                value={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                editable={false}
              />
            </View>
          </View>

          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={styles.label}>Preferred Date <Text style={styles.optional}>(Optional)</Text></Text>
            <View style={styles.inputWithIconContainer}>
              <MaterialIcons name="event-available" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Oct 25, 2023"
                placeholderTextColor="#94a3b8"
                value={preferredDate}
                onChangeText={setPreferredDate}
              />
            </View>
          </View>
        </View>
        
        <Text style={styles.disclaimerText}>
          A copy of this report will be sent to the property management office and the resident's registered email.
        </Text>

      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.draftButton}>
          <Text style={styles.draftButtonText}>Save Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: '#0f172a',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    color: '#1193d4',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 16,
  },
  inputGroupRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
  },
  optional: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
  input: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    justifyContent: 'space-between',
  },
  starButton: {
    flex: 1,
    height: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  readOnlyInputContainer: {
    height: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  readOnlyInput: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  inputWithIconContainer: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputWithIcon: {
    flex: 1,
    fontFamily: 'Manrope-Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  inputIcon: {
    marginRight: 8,
  },
  disclaimerText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 32,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  submitButton: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1193d4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1193d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
