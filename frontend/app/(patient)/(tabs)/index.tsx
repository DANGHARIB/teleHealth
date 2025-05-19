import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, View, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { patientAPI } from '@/services/api';
import { defaultDoctorImageBase64 } from '@/assets/images/default-doctor';

// API URL constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
const BASE_SERVER_URL = API_URL.replace('/api', '');

// Helper function to convert image paths into proper URLs
const getImageUrl = (imagePath: string | undefined): string | undefined => {
  if (!imagePath || imagePath.trim() === '') return undefined;
  
  // Handle both absolute paths (from older records) and relative paths
  if (imagePath.startsWith('C:') || imagePath.startsWith('/') || imagePath.startsWith('\\')) {
    // For absolute paths, extract just the filename
    const fileName = imagePath.split(/[\\\/]/).pop();
    return `${BASE_SERVER_URL}/uploads/${fileName}`;
  } else {
    // For proper relative paths
    return `${BASE_SERVER_URL}${imagePath.replace(/\\/g, '/')}`;
  }
};

// App theme colors
const COLORS = {
  primary: '#7AA7CC',
  primaryDark: '#6990B3',
  secondary: '#50C878',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  darkNavy: '#090F47',
  babyBlue: '#7AA7CC',
  text: '#333333',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  yellow: '#FFD700',
  white: '#FFFFFF',
}

type Doctor = {
  _id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  specialization?: string;
  price?: number;
  rating?: number;
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
      console.log('Saved doctors data:', data);
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
      console.log('Recommended doctors data:', data);
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

  const getDefaultImage = () => ({ uri: defaultDoctorImageBase64 });

  const handleExploreDoctor = (doctorId: string) => {
    router.push(`/patient/doctor/${doctorId}`);
  };

  const renderRatingStars = (rating: number = 4) => {
    const stars = [];
    const maxStars = 5;
    
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={16} 
          color={COLORS.yellow} 
          style={{marginRight: 2}}
        />
      );
    }
    
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  const renderDoctorItem = (item: Doctor) => {
    console.log('Rendering doctor item:', item);
    return (
    <TouchableOpacity 
      key={item._id}
      style={styles.doctorCard}
      onPress={() => handleExploreDoctor(item._id)}
      activeOpacity={0.8}
    >
      {item.doctor_image ? (
        <Image
          source={{ uri: getImageUrl(item.doctor_image) }}
          style={styles.doctorImage}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={[styles.doctorImage, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={32} color={COLORS.white} />
        </View>
      )}
      <View style={styles.doctorInfo}>
        <ThemedText type="title" style={styles.doctorName}>
          Dr. {getDoctorName(item)}
        </ThemedText>
        <ThemedText style={styles.specialization}>
          {item.specialization || 'General Practitioner'}
        </ThemedText>
        {renderRatingStars(item.rating)}
        <ThemedText style={styles.doctorExperience}>
          {item.experience} Years experience
        </ThemedText>
        <View style={styles.priceContainer}>
          <Ionicons name="wallet-outline" size={14} color={COLORS.primary} style={styles.priceIcon} />
          <ThemedText style={styles.priceText}>
            {item.price && item.price > 0 ? `$${item.price.toFixed(0)}/hr` : 'Price unavailable'}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => handleExploreDoctor(item._id)}
      >
        <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  )};

  const renderEmptyState = (message: string) => (
    <ThemedView style={styles.emptyStateContainer}>
      <Ionicons name="medical-outline" size={48} color={COLORS.primary} />
      <ThemedText style={styles.emptyStateText}>{message}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Find Doctors</ThemedText>
        <ThemedText style={styles.subtitle}>Your health care specialists</ThemedText>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recommended Doctors Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recommended for you
          </ThemedText>
          
          {recommendedLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : recommendedError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
              <ThemedText style={styles.errorText}>{recommendedError}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendedDoctors}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : recommendedDoctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={48} color={COLORS.textLight} />
              <ThemedText style={styles.noResults}>No recommendations yet</ThemedText>
              <ThemedText style={styles.noResultsHint}>Complete your assessment to get personalized recommendations</ThemedText>
            </View>
          ) : (
            recommendedDoctors.map((doctor) => renderDoctorItem(doctor))
          )}
        </View>

        {/* Favorite Doctors Section */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your favorite doctors
          </ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSavedDoctors}>
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : savedDoctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textLight} />
              <ThemedText style={styles.noResults}>No favorites yet</ThemedText>
              <ThemedText style={styles.noResultsHint}>Save doctors to find them here</ThemedText>
            </View>
          ) : (
            savedDoctors.map((doctor) => renderDoctorItem(doctor))
          )}
        </View>
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
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    padding: 16,
    alignItems: 'center',
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F4F4F4',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  doctorExperience: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceIcon: {
    marginRight: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#F2F5FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 30,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 20,
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.textLight,
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
}); 