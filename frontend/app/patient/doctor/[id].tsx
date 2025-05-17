import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI, patientAPI } from '@/services/api';

// App theme colors
const COLORS = {
  primary: '#7AA7CC',
  primaryDark: '#6A97BC',
  navyBlue: '#090F47',  // Navy blue for headings and important text
  babyBlue: '#7AA7CC',  // Baby blue for secondary text and accents
  darkNavy: '#090F47',  // Dark navy/blue for doctor information
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  text: '#333333',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  accent: '#7AA7CC',
  saveButton: '#FFFFFF',
  savedButton: '#7AA7CC',
};

// Define doctor data type
type Doctor = {
  _id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  specialization?: string;
  about?: string;
  education?: string;
  price?: number;
  working_hours?: {
    start?: string;
    end?: string;
  };
  rating?: number;
};

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const fetchDoctorDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doctorAPI.getDoctorById(id as string);
      setDoctor(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading doctor details:', err);
      setError('Unable to load doctor details');
      setLoading(false);
    }
  }, [id]);

  const checkIfDoctorIsSaved = useCallback(async () => {
    try {
      const savedDoctors = await patientAPI.getSavedDoctors();
      const isAlreadySaved = savedDoctors.some((doc: Doctor) => doc._id === id);
      setIsSaved(isAlreadySaved);
    } catch (err) {
      console.error('Error checking saved doctors:', err);
    }
  }, [id]);

  // Initial data loading
  useEffect(() => {
    if (id) {
      fetchDoctorDetails();
      checkIfDoctorIsSaved();
    }
  }, [id, fetchDoctorDetails, checkIfDoctorIsSaved]);

  // Refresh saved status when returning to this page
  useFocusEffect(
    useCallback(() => {
      checkIfDoctorIsSaved();
      return () => {
        // Optional cleanup
      };
    }, [checkIfDoctorIsSaved])
  );

  const getDefaultImage = () => require('@/assets/images/icon.png');
  
  const getDoctorName = (doctor: Doctor) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  };

  const handleBookAppointment = () => {
    if (!isSaved) {
      Alert.alert(
        'Save Required',
        'You need to save this doctor to your favorites before you can book an appointment.',
        [
          {
            text: 'OK',
            style: 'default',
          },
          {
            text: 'Save',
            onPress: handleSaveDoctor,
            style: 'default',
          }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/patient/appointment/new',
      params: { doctorId: id }
    });
  };

  const handleSaveDoctor = async () => {
    try {
      setSavingDoctor(true);
      
      if (isSaved) {
        // Remove doctor from favorites
        await patientAPI.removeSavedDoctor(id as string);
        setIsSaved(false);
        Alert.alert('Success', 'Doctor has been removed from your favorites');
      } else {
        // Add doctor to favorites
        await patientAPI.saveDoctor(id as string);
        setIsSaved(true);
        Alert.alert('Success', 'Doctor has been added to your favorites');
      }
      
      setSavingDoctor(false);
    } catch (err) {
      console.error('Error saving doctor:', err);
      Alert.alert('Error', 'An error occurred while saving the doctor');
      setSavingDoctor(false);
    }
  };

  const renderRatingStars = (rating: number = 4) => {
    const stars = [];
    const maxStars = 5;
    
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={20} 
          color="#FFD700" 
          style={styles.starIcon} 
        />
      );
    }
    
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Doctor Details',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
            color: COLORS.navyBlue
          },
          headerTintColor: COLORS.babyBlue,
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.babyBlue} style={styles.loader} />
      ) : error ? (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : doctor ? (
        <ScrollView style={styles.container}>
          <View style={styles.doctorCardContainer}>
            <ThemedView style={styles.doctorCard}>
              <View style={styles.doctorProfile}>
                <Image
                  source={doctor.doctor_image ? { uri: doctor.doctor_image } : getDefaultImage()}
                  style={styles.doctorImage}
                  contentFit="cover"
                />
                <View style={styles.doctorInfo}>
                  <ThemedText type="title" style={styles.doctorName}>
                    Dr. {getDoctorName(doctor)}
                  </ThemedText>
                  {renderRatingStars(doctor.rating)}
                  <ThemedText style={styles.specialization}>
                    {doctor.specialization || 'General Practitioner'}
                  </ThemedText>
                  <ThemedText style={styles.priceText}>
                    ${doctor.price ? doctor.price.toFixed(2) : '28.00'}/hr
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.badgeRow}>
                <ThemedView style={styles.experienceBadge}>
                  <Ionicons name="time-outline" size={18} color={COLORS.navyBlue} style={styles.badgeIcon} />
                  <ThemedText style={styles.experienceText}>
                    {doctor.experience} Years experience
                  </ThemedText>
                </ThemedView>
                
                <View style={styles.saveContainer}>
                  <TouchableOpacity 
                    style={[styles.heartButton, isSaved && styles.heartButtonActive]}
                    onPress={handleSaveDoctor}
                    disabled={savingDoctor}
                  >
                    <Ionicons 
                      name={isSaved ? "heart" : "heart-outline"} 
                      size={22} 
                      color={isSaved ? "#fff" : COLORS.babyBlue} 
                    />
                    {!isSaved && <Ionicons name="add-outline" size={12} color={COLORS.babyBlue} style={styles.addIcon} />}
                  </TouchableOpacity>
                  <ThemedText style={styles.saveLabel}>
                    {isSaved ? 'Saved' : 'Tap to save'}
                  </ThemedText>
                </View>
              </View>
            </ThemedView>
            
          </View>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.sectionContent}>
              {doctor.about || 
                'Professional doctor with extensive experience in patient care. Specializes in providing comprehensive medical services and personalized treatment plans for various conditions.'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Education</ThemedText>
            <ThemedText style={styles.sectionContent}>
              {doctor.education || 
                'M.Sc. - Doctor in psychology from ADR-Centric Juridical University.'}
            </ThemedText>
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.bookButton, !isSaved && styles.disabledButton]}
              onPress={handleBookAppointment}
            >
              <ThemedText style={styles.bookButtonText}>Book Appointment</ThemedText>
            </TouchableOpacity>
          </View>
          
          {!isSaved && (
            <ThemedView style={styles.noticeContainer}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.textLight} style={styles.noticeIcon} />
              <ThemedText style={styles.noticeText}>
                You need to save this doctor before you can book an appointment.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Doctor not found</ThemedText>
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
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  doctorCardContainer: {
    position: 'relative',
    margin: 16,
  },
  doctorCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  saveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButton: {
    backgroundColor: COLORS.saveButton,
    borderRadius: 30,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: COLORS.babyBlue,
    position: 'relative',
  },
  heartButtonActive: {
    backgroundColor: COLORS.savedButton,
    borderWidth: 0,
  },
  doctorProfile: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  doctorImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F4F4F4',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.navyBlue,
    marginBottom: 5,
  },
  specialization: {
    fontSize: 16,
    color: COLORS.babyBlue,
    marginBottom: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  starIcon: {
    marginRight: 2,
  },
  priceText: {
    fontSize: 17,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  experienceBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(122, 167, 204, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 6,
  },
  experienceText: {
    fontSize: 14,
    color: COLORS.babyBlue,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navyBlue,
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textLight,
  },
  buttonContainer: {
    margin: 16,
    marginTop: 0,
  },
  bookButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0c1e7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noticeContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIcon: {
    marginRight: 8,
  },
  noticeText: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  addIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 14,
    height: 14,
    textAlign: 'center',
    lineHeight: 14,
    overflow: 'hidden',
  },
  saveLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
}); 