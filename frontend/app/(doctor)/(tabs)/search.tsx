import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await doctorAPI.getSavedPatients();
        setPatients(data);
        setFilteredPatients(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des patients:', err);
        setError('Impossible de charger les patients');
        setLoading(false);
      }
    };

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
      console.error('Erreur lors de la recherche de patients:', err);
      setError('Impossible de rechercher des patients');
      setLoading(false);
    }
  };

  const handleViewPatient = (patientId: string) => {
    // Redirection vers la page de détail du patient
    router.push(`/doctor/patient/${patientId}`);
  };

  const getPatientName = (patient: Patient) => {
    if (patient.user?.fullName) return patient.user.fullName;
    if (patient.first_name || patient.last_name) {
      return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    }
    return 'Patient sans nom';
  };

  const getDefaultImage = () => require('@/assets/images/icon.png');

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Rechercher des patients</ThemedText>
      
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#8e8e93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher"
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
      ) : filteredPatients.length === 0 ? (
        <ThemedText style={styles.noResults}>Aucun patient trouvé</ThemedText>
      ) : (
        filteredPatients.map((patient) => (
          <ThemedView key={patient._id} style={styles.patientCard}>
            <Image
              source={getDefaultImage()}
              style={styles.patientImage}
              contentFit="cover"
            />
            <ThemedView style={styles.patientInfo}>
              <ThemedText type="title" style={styles.patientName}>
                {getPatientName(patient)}
              </ThemedText>
              <ThemedText style={styles.patientDetails}>
                {patient.gender ? `${patient.gender} • ` : ''}
                {patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'Âge inconnu'}
              </ThemedText>
              {patient.has_taken_assessment && (
                <ThemedView style={styles.assessmentBadge}>
                  <ThemedText style={styles.assessmentText}>Évaluation complétée</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewPatient(patient._id)}
            >
              <ThemedText style={styles.viewButtonText}>Voir</ThemedText>
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
  patientCard: {
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
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  assessmentBadge: {
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  assessmentText: {
    fontSize: 12,
    color: '#00838f',
  },
  viewButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  viewButtonText: {
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