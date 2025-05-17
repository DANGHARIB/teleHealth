import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { patientAPI } from '@/services/api';

type Doctor = {
  _id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  specialization?: string;
  price?: number;
};

export default function PatientHomeScreen() {
  const [savedDoctors, setSavedDoctors] = useState<Doctor[]>([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendedError, setRecommendedError] = useState('');

  const fetchSavedDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getSavedDoctors();
      setSavedDoctors(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading saved doctors:', err);
      setError('Unable to load your favorite doctors');
      setLoading(false);
    }
  }, []);

  const fetchRecommendedDoctors = useCallback(async () => {
    try {
      setRecommendedLoading(true);
      const data = await patientAPI.getRecommendedDoctors();
      setRecommendedDoctors(data);
      setRecommendedLoading(false);
    } catch (err) {
      console.error('Error loading recommended doctors:', err);
      setRecommendedError('Unable to load recommendations');
      setRecommendedLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchSavedDoctors();
    fetchRecommendedDoctors();
  }, [fetchSavedDoctors, fetchRecommendedDoctors]);

  // Refresh data when tab becomes active
  useFocusEffect(
    useCallback(() => {
      fetchSavedDoctors();
      fetchRecommendedDoctors();
      return () => {
        // Optional cleanup
      };
    }, [fetchSavedDoctors, fetchRecommendedDoctors])
  );

  const getDoctorName = (doctor: Doctor) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  };

  const getDefaultImage = () => require('@/assets/images/icon.png');

  const handleExploreDoctor = (doctorId: string) => {
    router.push(`/patient/doctor/${doctorId}`);
  };

  const renderDoctorItem = ({ item }: { item: Doctor }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => handleExploreDoctor(item._id)}
    >
      <Image
        source={item.doctor_image ? { uri: item.doctor_image } : getDefaultImage()}
        style={styles.doctorImage}
        contentFit="cover"
      />
      <ThemedView style={styles.doctorInfo}>
        <ThemedText type="defaultSemiBold" style={styles.doctorName}>
          Dr. {getDoctorName(item)}
        </ThemedText>
        <ThemedText style={styles.doctorSpecialization}>
          {item.specialization || 'General Practitioner'}
        </ThemedText>
        <View style={styles.doctorDetails}>
          <View style={styles.experienceTag}>
            <ThemedText style={styles.doctorExperience}>
              {item.experience} yrs exp
            </ThemedText>
          </View>
          {item.price && (
            <View style={styles.priceTag}>
              <ThemedText style={styles.doctorPrice}>
                ${item.price.toFixed(0)}/hr
              </ThemedText>
            </View>
          )}
        </View>
      </ThemedView>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#A1CEDC" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string) => (
    <ThemedView style={styles.emptyStateContainer}>
      <Ionicons name="medical-outline" size={48} color="#A1CEDC" />
      <ThemedText style={styles.emptyStateText}>{message}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Doctors</ThemedText>
      </ThemedView>
      
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {/* Recommended Doctors Section */}
            <ThemedView style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Recommended for you
              </ThemedText>
              
              {recommendedLoading ? (
                <ActivityIndicator size="large" color="#A1CEDC" style={styles.loader} />
              ) : recommendedError ? (
                <ThemedText style={styles.errorText}>{recommendedError}</ThemedText>
              ) : recommendedDoctors.length === 0 ? (
                renderEmptyState('Complete your assessment to get personalized recommendations.')
              ) : (
                <FlatList
                  data={recommendedDoctors}
                  renderItem={renderDoctorItem}
                  keyExtractor={(item) => `recommended-${item._id}`}
                  horizontal={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </ThemedView>

            {/* Favorite Doctors Section */}
            <ThemedView style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Your favorite doctors
              </ThemedText>
              
              {loading ? (
                <ActivityIndicator size="large" color="#A1CEDC" style={styles.loader} />
              ) : error ? (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              ) : savedDoctors.length === 0 ? (
                renderEmptyState('You don\'t have any favorite doctors yet.')
              ) : (
                <FlatList
                  data={savedDoctors}
                  renderItem={renderDoctorItem}
                  keyExtractor={(item) => `saved-${item._id}`}
                  horizontal={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </ThemedView>
          </>
        }
        renderItem={() => null}
        keyExtractor={() => 'dummy'}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14104B',
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#14104B',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  doctorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#14104B',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 15,
    color: '#71727A',
    marginBottom: 8,
  },
  doctorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  experienceTag: {
    backgroundColor: '#F0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  doctorExperience: {
    fontSize: 13,
    color: '#4A90E2',
  },
  priceTag: {
    backgroundColor: '#F0F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doctorPrice: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 30,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 15,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
}); 