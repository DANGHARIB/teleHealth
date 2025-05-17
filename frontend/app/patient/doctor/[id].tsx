import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI, patientAPI } from '@/services/api';

// Définir le type pour les données du médecin
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
      console.error('Erreur lors du chargement des détails du médecin:', err);
      setError('Impossible de charger les détails du médecin');
      setLoading(false);
    }
  }, [id]);

  const checkIfDoctorIsSaved = useCallback(async () => {
    try {
      const savedDoctors = await patientAPI.getSavedDoctors();
      const isAlreadySaved = savedDoctors.some((doc: Doctor) => doc._id === id);
      setIsSaved(isAlreadySaved);
    } catch (err) {
      console.error('Erreur lors de la vérification des médecins sauvegardés:', err);
    }
  }, [id]);

  // Chargement initial des données
  useEffect(() => {
    if (id) {
      fetchDoctorDetails();
      checkIfDoctorIsSaved();
    }
  }, [id, fetchDoctorDetails, checkIfDoctorIsSaved]);

  // Rafraîchir le statut de sauvegarde à chaque retour sur cette page
  useFocusEffect(
    useCallback(() => {
      checkIfDoctorIsSaved();
      return () => {
        // Nettoyage optionnel
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
        'Enregistrement requis',
        'Vous devez d\'abord enregistrer ce médecin dans vos favoris avant de pouvoir prendre rendez-vous.',
        [
          {
            text: 'OK',
            style: 'default',
          },
          {
            text: 'Enregistrer',
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
        // Supprimer le médecin des favoris
        await patientAPI.removeSavedDoctor(id as string);
        setIsSaved(false);
        Alert.alert('Succès', 'Le médecin a été retiré de vos favoris');
      } else {
        // Ajouter le médecin aux favoris
        await patientAPI.saveDoctor(id as string);
        setIsSaved(true);
        Alert.alert('Succès', 'Le médecin a été ajouté à vos favoris');
      }
      
      setSavingDoctor(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du médecin:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde du médecin');
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
          size={24} 
          color="#FFD700" 
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
            color: '#14104B'
          },
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : error ? (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : doctor ? (
        <ScrollView style={styles.container}>
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
                <ThemedText style={styles.priceText}>
                  $ {doctor.price ? doctor.price.toFixed(2) : '28.00'}/hr
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.experienceText}>
              {doctor.experience} Years experience
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.sectionContent}>
              {doctor.about || 
                'Inceptos tincidunt sodales cursus maximus dis quisque mollis. Blandit ex pretium montes vivamus adipiscing. Finibus nunc per efficitur netus scelerisque suscipit donec elit quis.'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Education</ThemedText>
            <ThemedText style={styles.sectionContent}>
              {doctor.education || 
                'M.Sc. - Dr in psychology from ADR-Centric Juridical University.'}
            </ThemedText>
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, isSaved && styles.savedButton]}
              onPress={handleSaveDoctor}
              disabled={savingDoctor}
            >
              <Ionicons 
                name={isSaved ? "heart" : "heart-outline"} 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <ThemedText style={styles.saveButtonText}>
                {isSaved ? 'Enregistré' : 'Enregistrer'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bookButton, !isSaved && styles.disabledButton]}
              onPress={handleBookAppointment}
            >
              <ThemedText style={styles.bookButtonText}>Book Appointment</ThemedText>
            </TouchableOpacity>
          </View>
          
          <ThemedView style={styles.noticeContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#666" style={styles.noticeIcon} />
            <ThemedText style={styles.noticeText}>
              Vous devez enregistrer ce médecin avant de pouvoir prendre rendez-vous.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Médecin non trouvé</ThemedText>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14104B',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 18,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  experienceText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14104B',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 0,
  },
  saveButton: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    padding: 16,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedButton: {
    backgroundColor: '#e74c3c',
  },
  bookButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 16,
    flex: 2,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0c1e7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noticeContainer: {
    backgroundColor: '#ffffff',
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
    fontSize: 16,
    color: '#666',
  },
}); 