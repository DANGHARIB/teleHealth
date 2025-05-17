import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

// App theme colors
const COLORS = {
  primary: '#2D87BB',
  primaryDark: '#1A5F8C',
  primaryGradientStart: '#3498db',
  primaryGradientEnd: '#1d6fa5',
  secondary: '#50C878', // emerald green for accents
  accent: '#6BB9F0',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  navyBlue: '#0A2463',  // Navy blue for headings and important text
  babyBlue: '#7AA7CC',  // Baby blue for secondary text and accents
  darkNavy: '#090F47',  // Dark navy for patient information
  text: '#333333',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  badge: '#E1F5FE',
  badgeText: '#0288D1',
}

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

export default function DoctorSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await doctorAPI.getSavedPatients();
      setPatients(data);
      setFilteredPatients(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Unable to load patients');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => 
        (patient.first_name && patient.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (patient.last_name && patient.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (patient.user?.fullName && patient.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
      return;
    }

    try {
      setLoading(true);
      const data = await doctorAPI.searchSavedPatients(searchQuery);
      setFilteredPatients(data);
      setLoading(false);
    } catch (err) {
      console.error('Error searching for patients:', err);
      setError('Unable to search for patients');
      setLoading(false);
    }
  };

  const handleViewPatient = (patientId: string) => {
    // Redirect to patient detail page
    router.push(`/doctor/patient/${patientId}`);
  };

  const getPatientName = (patient: Patient) => {
    if (patient.user?.fullName) return patient.user.fullName;
    if (patient.first_name || patient.last_name) {
      return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    }
    return 'Patient without name';
  };

  const getDefaultImage = (patient: Patient) => {
    // Use gender-based avatars for better representation
    const gender = patient.gender?.toLowerCase();
    if (gender === 'homme' || gender === 'male') {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
    } else if (gender === 'femme' || gender === 'female') {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png' };
    } else {
      return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png' };
    }
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

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Patients</ThemedText>
      </View>

      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={22} color={COLORS.darkNavy} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.darkNavy} />
          </TouchableOpacity>
        )}
      </ThemedView>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchPatients()}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <ThemedText style={styles.noResults}>No patients found</ThemedText>
            <ThemedText style={styles.noResultsHint}>Try a different search term or check your connection</ThemedText>
          </View>
        ) : (
          filteredPatients.map((patient) => (
            <TouchableOpacity 
              key={patient._id} 
              style={styles.patientCard}
              onPress={() => handleViewPatient(patient._id)}
              activeOpacity={0.8}
            >
              <View style={styles.patientCardContent}>
                <Image
                  source={getDefaultImage(patient)}
                  style={styles.patientImage}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.patientInfo}>
                  <ThemedText type="title" style={styles.patientName}>
                    {getPatientName(patient)}
                  </ThemedText>
                  <ThemedText style={styles.patientDetails}>
                    {patient.gender ? `${patient.gender} • ` : ''}
                    {patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'Unknown age'}
                  </ThemedText>
                  {patient.has_taken_assessment && (
                    <View style={styles.assessmentBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={COLORS.darkNavy} style={{marginRight: 4}} />
                      <ThemedText style={styles.assessmentText}>Assessment completed</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.darkNavy} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.darkNavy,
  },
  clearButton: {
    padding: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  patientCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  patientCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#F4F4F4',
  },
  patientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: COLORS.babyBlue,
    marginBottom: 5,
  },
  assessmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 167, 204, 0.1)',  // Light baby blue background using #7AA7CC with opacity
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  assessmentText: {
    fontSize: 12,
    color: COLORS.babyBlue,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  noResults: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkNavy,
    marginTop: 12,
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 14,
    color: COLORS.babyBlue,
    textAlign: 'center',
  }
}); 