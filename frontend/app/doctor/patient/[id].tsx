import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

// Définir le type pour les données du patient
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
        setError('Patient non trouvé');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des détails du patient:', err);
      setError('Impossible de charger les détails du patient');
      setLoading(false);
    }
  }, [id]);

  // Chargement initial des données
  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id, fetchPatientDetails]);

  // Rafraîchir les données à chaque retour sur cette page
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchPatientDetails();
      }
      return () => {
        // Nettoyage optionnel
      };
    }, [fetchPatientDetails, id])
  );

  const getDefaultImage = () => require('@/assets/images/icon.png');
  
  const getPatientName = (patient: Patient) => {
    if (patient.user?.fullName) return patient.user.fullName;
    if (patient.first_name || patient.last_name) {
      return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    }
    return 'Patient sans nom';
  };

  const calculateAge = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return 'Âge inconnu';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} ans`;
  };

  const handleContactPatient = () => {
    // Fonction à implémenter pour contacter le patient
    Alert.alert('Contact', `Contacter ${getPatientName(patient!)}`);
  };

  const handleScheduleAppointment = () => {
    // Fonction à implémenter pour planifier un rendez-vous
    Alert.alert('Rendez-vous', `Planifier un rendez-vous avec ${getPatientName(patient!)}`);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Détails du patient',
          headerShown: true,
          headerBackTitle: 'Retour',
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
      ) : patient ? (
        <ScrollView style={styles.container}>
          <ThemedView style={styles.patientCard}>
            <View style={styles.patientProfile}>
              <Image
                source={getDefaultImage()}
                style={styles.patientImage}
                contentFit="cover"
              />
              <View style={styles.patientInfo}>
                <ThemedText type="title" style={styles.patientName}>
                  {getPatientName(patient)}
                </ThemedText>
                <ThemedText style={styles.patientDetails}>
                  {patient.gender ? `${patient.gender} • ` : ''}
                  {patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'Âge inconnu'}
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
                <Ionicons name="checkmark-circle" size={20} color="#00838f" style={styles.badgeIcon} />
                <ThemedText style={styles.assessmentText}>Évaluation complétée</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Informations personnelles</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Nom</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.last_name || 'Non renseigné'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Prénom</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.first_name || 'Non renseigné'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Genre</ThemedText>
              <ThemedText style={styles.infoValue}>{patient.gender || 'Non renseigné'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date de naissance</ThemedText>
              <ThemedText style={styles.infoValue}>
                {patient.date_of_birth 
                  ? new Date(patient.date_of_birth).toLocaleDateString('fr-FR')
                  : 'Non renseignée'}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>Statut médical</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Évaluation initiale</ThemedText>
              <ThemedText style={[
                styles.statusValue, 
                {color: patient.has_taken_assessment ? '#00838f' : '#e57373'}
              ]}>
                {patient.has_taken_assessment ? 'Complétée' : 'Non complétée'}
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
                Contacter
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={handleScheduleAppointment}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <ThemedText style={styles.buttonText}>Rendez-vous</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Patient non trouvé</ThemedText>
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
    textAlign: 'center',
    color: 'red',
    margin: 20,
    fontSize: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
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
  },
  patientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  assessmentBadge: {
    flexDirection: 'row',
    backgroundColor: '#e0f7fa',
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
    color: '#00838f',
  },
  section: {
    backgroundColor: '#fff',
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
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginBottom: 30,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#14104B',
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 