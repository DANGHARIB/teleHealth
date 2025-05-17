import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
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
      console.error('Erreur lors du chargement des médecins sauvegardés:', err);
      setError('Impossible de charger vos médecins favoris');
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
      console.error('Erreur lors du chargement des médecins recommandés:', err);
      setRecommendedError('Impossible de charger les recommandations');
      setRecommendedLoading(false);
    }
  }, []);

  // Charger les données initiales
  useEffect(() => {
    fetchSavedDoctors();
    fetchRecommendedDoctors();
  }, [fetchSavedDoctors, fetchRecommendedDoctors]);

  // Rafraîchir les données à chaque fois que l'onglet redevient actif
  useFocusEffect(
    useCallback(() => {
      fetchSavedDoctors();
      fetchRecommendedDoctors();
      return () => {
        // Nettoyage optionnel
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
        <ThemedView style={styles.doctorDetails}>
          <ThemedText style={styles.doctorExperience}>
            {item.experience} Years exp
          </ThemedText>
          {item.price && (
            <ThemedText style={styles.doctorPrice}>
              ${item.price.toFixed(2)}/hr
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bienvenue!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Médecins recommandés */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recommandés pour vous
        </ThemedText>
        
        {recommendedLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : recommendedError ? (
          <ThemedText style={styles.errorText}>{recommendedError}</ThemedText>
        ) : recommendedDoctors.length === 0 ? (
          <ThemedText style={styles.noResultsText}>
            Complétez votre évaluation pour obtenir des recommandations personnalisées.
          </ThemedText>
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

      {/* Médecins favoris */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Vos médecins favoris
        </ThemedText>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : savedDoctors.length === 0 ? (
          <ThemedText style={styles.noResultsText}>
            Vous n&apos;avez aucun médecin favori. Explorez la section &quot;Search&quot; pour trouver des médecins.
          </ThemedText>
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

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Besoin d&apos;aide?</ThemedText>
        <ThemedText>
          Utilisez l&apos;onglet &quot;Search&quot; pour rechercher des médecins et les ajouter à vos favoris.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginTop: 20,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#14104B',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14104B',
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  doctorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
  },
  doctorPrice: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
}); 