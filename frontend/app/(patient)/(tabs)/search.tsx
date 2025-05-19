import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';
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
  full_name: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  specialization?: string;
  rating?: number;
  price?: number;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorAPI.getDoctors();
      console.log('Fetched doctor data:', data);
      setDoctors(data);
      setFilteredDoctors(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des médecins:', err);
      setError('Impossible de charger les médecins');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor => 
        (doctor.full_name && doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doctor.first_name && doctor.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doctor.last_name && doctor.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
      return;
    }

    try {
      setLoading(true);
      const data = await doctorAPI.searchDoctors(searchQuery);
      console.log('Search results:', data);
      setFilteredDoctors(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la recherche de médecins:', err);
      setError('Impossible de rechercher des médecins');
      setLoading(false);
    }
  };

  const handleExplore = (doctorId: string) => {
    router.push(`/patient/doctor/${doctorId}`);
  };

  const getDoctorName = (doctor: Doctor) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  };

  const getDefaultImage = () => ({ uri: defaultDoctorImageBase64 });

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

  const renderDoctorItem = (doctor: Doctor) => (
    <TouchableOpacity 
      key={doctor._id}
      style={styles.doctorCard}
      onPress={() => handleExplore(doctor._id)}
      activeOpacity={0.8}
    >
      {doctor.doctor_image ? (
        <Image
          source={{ uri: getImageUrl(doctor.doctor_image) }}
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
          Dr. {getDoctorName(doctor)}
        </ThemedText>
        <ThemedText style={styles.specialization}>
          {doctor.specialization || 'General Practitioner'}
        </ThemedText>
        {renderRatingStars(doctor.rating)}
        <ThemedText style={styles.doctorExperience}>
          {doctor.experience} Years experience
        </ThemedText>
        <View style={styles.priceContainer}>
          <Ionicons name="wallet-outline" size={14} color={COLORS.primary} style={styles.priceIcon} />
          <ThemedText style={styles.priceText}>
            {doctor.price && doctor.price > 0 ? `$${doctor.price.toFixed(0)}/hr` : 'Price unavailable'}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => handleExplore(doctor._id)}
      >
        <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Find Doctors</ThemedText>
        <ThemedText style={styles.subtitle}>Search for the best medical specialists available</ThemedText>
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
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchDoctors()}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <ThemedText style={styles.noResults}>No doctors found</ThemedText>
            <ThemedText style={styles.noResultsHint}>Try a different search term or check your connection</ThemedText>
          </View>
        ) : (
          filteredDoctors.map((doctor) => renderDoctorItem(doctor))
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
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
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
    paddingBottom: 100,
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
    color: COLORS.textLight,
    textAlign: 'center',
  }
}); 