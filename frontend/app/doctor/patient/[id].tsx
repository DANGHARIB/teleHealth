import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

// App theme colors
const COLORS = {
  primary: '#2D87BB',
  primaryDark: '#1A5F8C',
  navyBlue: '#0A2463',  // Navy blue for headings and important text
  babyBlue: '#7AA7CC',  // Baby blue for secondary text and accents
  darkNavy: '#090F47',  // Dark navy/blue for patient information
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  text: '#333333',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  badge: '#E1F5FE',
  badgeText: '#0288D1',
};

// Override badgeText to use babyBlue
COLORS.badgeText = COLORS.babyBlue;

// Define patient data type
type Patient = {
  _id: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  has_taken_assessment: boolean;
  user?: {
    fullName: string;
    email: string;
  }
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatientDetails = useCallback(async () => {
    try {
      setLoading(true);
      const patients = await doctorAPI.getSavedPatients();
      const foundPatient = patients.find((p: Patient) => p._id === id);
      
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        setError('Patient not found');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading patient details:', err);
      setError('Unable to load patient details');
      setLoading(false);
    }
  }, [id]);

  // Initial data loading
  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id, fetchPatientDetails]);

  // Refresh data when returning to this page
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchPatientDetails();
      }
      return () => {
        // Optional cleanup
      };
    }, [fetchPatientDetails, id])
  );

  const getDefaultImage = (patient: Patient) => {
    // Use gender-based avatars for better representation
    const gender = patient?.gender?.toLowerCase();
    if (gender === 'homme' || gender === 'male') {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
    } else if (gender === 'femme' || gender === 'female') {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png' };
    } else {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png' };
    }
  };
  
  const getPatientName = (patient: Patient) => {
    if (patient.user?.fullName) return patient.user.fullName;
    if (patient.first_name || patient.last_name) {
      return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    }
    return 'Patient without name';
  };

  const calculateAge = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return 'Unknown age';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };

  const handleContactPatient = () => {
    if (patient?.user?.email) {
      const subject = `Medical follow-up for ${getPatientName(patient)}`;
      const body = `Hello ${getPatientName(patient)},\n\nI'm reaching out regarding your medical follow-up.\n\nBest regards,\nDr. `;
      
      const emailUrl = `mailto:${patient.user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      Linking.canOpenURL(emailUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(emailUrl);
          } else {
            Alert.alert('Error', 'Email app is not available or cannot be opened');
          }
        })
        .catch((err) => {
          console.error('An error occurred', err);
          Alert.alert('Error', 'Could not open email client');
        });
    } else {
      Alert.alert('No Email Available', 'This patient does not have an email address on file.');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.babyBlue} style={styles.loader} />
      ) : error ? (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : patient ? (
        <ScrollView style={styles.container}>
          <ThemedView style={styles.patientCard}>
            <View style={styles.patientProfile}>
              <Image
                source={getDefaultImage(patient)}
                style={styles.patientImage}
                contentFit="cover"
              />
              <View style={styles.patientInfo}>
                <ThemedText type="title" style={styles.patientName}>
                  {getPatientName(patient)}
                </ThemedText>
                <ThemedText style={styles.patientDetails}>
                  {patient.gender ? `${patient.gender} • ` : ''}
                  {patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'Unknown age'}
                </ThemedText>
                {patient.user?.email && (
                  <ThemedText style={styles.emailText}>
                    {patient.user.email}
                  </ThemedText>
                )}
              </View>
            </View>
            
            {patient.has_taken_assessment && (
              <ThemedView style={styles.assessmentBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.navyBlue} style={styles.badgeIcon} />
                <ThemedText style={styles.assessmentText}>Assessment completed</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Personal Information</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Last Name</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.last_name || 'Not provided'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>First Name</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.first_name || 'Not provided'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Gender</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.gender || 'Not provided'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date of Birth</ThemedText>
              <ThemedText style={styles.infoValue}>
                {patient.date_of_birth 
                  ? new Date(patient.date_of_birth).toLocaleDateString('en-US')
                  : 'Not provided'}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Medical Status</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Initial Assessment</ThemedText>
              <ThemedText style={[
                styles.statusValue, 
                {color: patient.has_taken_assessment ? COLORS.navyBlue : COLORS.error}
              ]}>
                {patient.has_taken_assessment ? 'Completed' : 'Not completed'}
              </ThemedText>
            </View>
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactPatient}
            >
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <ThemedText style={styles.buttonText}>
                Contact
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.notesButton}
              onPress={() => router.push(`/doctor/notes/patient/${patient._id}`)}
            >
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <ThemedText style={styles.buttonText}>
                View Notes
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Patient not found</ThemedText>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.error,
    margin: 20,
    fontSize: 16,
  },
  patientCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#F4F4F4',
  },
  patientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.navyBlue,
  },
  patientDetails: {
    fontSize: 16,
    color: COLORS.babyBlue,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  assessmentBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(122, 167, 204, 0.1)', // Light baby blue background using #7AA7CC with opacity
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  badgeIcon: {
    marginRight: 6,
  },
  assessmentText: {
    fontSize: 14,
    color: COLORS.babyBlue,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.navyBlue,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.darkNavy,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.darkNavy,
  },
  buttonContainer: {
    margin: 16,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.babyBlue,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notesButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.babyBlue,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
}); 