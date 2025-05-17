import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

type Doctor = {
  _id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  specialization?: string;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await doctorAPI.getDoctors();
        setDoctors(data);
        setFilteredDoctors(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des médecins:', err);
        setError('Impossible de charger les médecins');
        setLoading(false);
      }
    };

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

  const getDefaultImage = () => require('@/assets/images/icon.png');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Search Doctors</ThemedText>
      
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#8e8e93" />
          </TouchableOpacity>
        )}
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : filteredDoctors.length === 0 ? (
        <ThemedText style={styles.noResults}>Aucun médecin trouvé</ThemedText>
      ) : (
        filteredDoctors.map((doctor) => (
          <ThemedView key={doctor._id} style={styles.doctorCard}>
            <Image
              source={doctor.doctor_image ? { uri: doctor.doctor_image } : getDefaultImage()}
              style={styles.doctorImage}
              contentFit="cover"
            />
            <ThemedView style={styles.doctorInfo}>
              <ThemedText type="title" style={styles.doctorName}>
                Dr. {getDoctorName(doctor)}
              </ThemedText>
              <ThemedText style={styles.doctorExperience}>
                {doctor.experience} Years experience
              </ThemedText>
            </ThemedView>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => handleExplore(doctor._id)}
            >
              <ThemedText style={styles.exploreButtonText}>Explore</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  exploreButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
}); 