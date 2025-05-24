import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';
import { format } from 'date-fns';

const COLORS = {
  primary: '#7AA7CC',
  primaryLight: '#8FB5D5',
  primaryDark: '#6999BE',
  secondary: '#F8FAFC',
  accent: '#7AA7CC',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  purple: '#8B5CF6',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#090F47',
  white: '#FFFFFF',
  background: '#FAFBFE',
};

export default function CreateAppointmentNote() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  
  // States for note fields
  const [content, setContent] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');

  // Load appointment details
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      
      try {
        setLoading(true);
        const data = await doctorAPI.getAppointmentById(appointmentId as string);
        setAppointment(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading appointment:', error);
        Alert.alert(
          'Error',
          'Unable to load appointment details.'
        );
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  // Format appointment date
  const formatAppointmentDate = (appointment: any) => {
    if (!appointment || !appointment.availability || !appointment.availability.date) {
      return 'Unknown date';
    }
    
    try {
      const date = new Date(appointment.availability.date);
      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Save note
  const saveNote = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Note content cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      
      await doctorAPI.createAppointmentNote({
        appointmentId,
        content,
        diagnosis,
        treatment,
        advice,
        followUp
      });
      
      setSaving(false);
      Alert.alert(
        'Success',
        'Note has been saved successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving note:', error);
      setSaving(false);
      Alert.alert(
        'Error',
        'Unable to save note. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <ThemedText style={styles.loadingText}>Loading appointment details...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'New Note',
          headerBackTitle: 'Back',
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          {appointment && (
            <ThemedView style={styles.appointmentInfoCard}>
              <ThemedText style={styles.appointmentInfoTitle}>
                Appointment Details
              </ThemedText>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Patient:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {appointment.patient ? 
                    `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}`.trim() || 'Name not available' 
                    : 'Patient not available'}
                </ThemedText>
              </View>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Date:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {formatAppointmentDate(appointment)}
                </ThemedText>
              </View>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Time:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {appointment.slotStartTime} - {appointment.slotEndTime}
                </ThemedText>
              </View>
              
              {appointment.caseDetails && (
                <View style={styles.appointmentInfoRow}>
                  <ThemedText style={styles.appointmentInfoLabel}>Reason:</ThemedText>
                  <ThemedText style={styles.appointmentInfoValue}>
                    {appointment.caseDetails}
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          )}
          
          <ThemedView style={styles.noteCard}>
            <ThemedText style={styles.sectionTitle}>General Notes</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Enter your consultation notes..."
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />
            
            <ThemedText style={styles.sectionTitle}>Diagnosis</ThemedText>
            <RNTextInput
              style={styles.textInput}
              placeholder="Enter diagnosis"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
            
            <ThemedText style={styles.sectionTitle}>Prescribed Treatment</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Enter prescribed treatment"
              multiline
              textAlignVertical="top"
              value={treatment}
              onChangeText={setTreatment}
            />
            
            <ThemedText style={styles.sectionTitle}>Advice</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Enter advice given to patient"
              multiline
              textAlignVertical="top"
              value={advice}
              onChangeText={setAdvice}
            />
            
            <ThemedText style={styles.sectionTitle}>Recommended Follow-up</ThemedText>
            <RNTextInput
              style={styles.textInput}
              placeholder="Enter recommended follow-up"
              value={followUp}
              onChangeText={setFollowUp}
            />
          </ThemedView>
        </ScrollView>
        
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveNote}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={COLORS.white} />
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray500,
  },
  appointmentInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  appointmentInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  appointmentInfoLabel: {
    fontWeight: '600',
    color: COLORS.gray700,
    width: 80,
  },
  appointmentInfoValue: {
    flex: 1,
    color: COLORS.gray800,
  },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 80, // Space for actionBar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray800,
    backgroundColor: COLORS.gray100,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray800,
    backgroundColor: COLORS.gray100,
    minHeight: 100,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
}); 