import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, 
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// TODO: Définir une interface plus spécifique pour le profil Docteur si nécessaire
interface DoctorFormData {
  email: string;
  first_name: string;
  last_name: string;
  // Champs potentiels spécifiques au médecin:
  // specialty?: string;
  // license_number?: string;
  // office_address?: string;
}

export default function EditDoctorProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>({
    email: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        router.replace('/doctor/auth'); // Rediriger vers la connexion médecin
        return;
      }

      const response = await fetch(`${API_URL}/doctors/profile`, { // API endpoint pour médecin
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          email: data.user?.email || '',
          first_name: data.profile?.first_name || data.user?.fullName?.split(' ')[0] || '',
          last_name: data.profile?.last_name || data.user?.fullName?.split(' ').slice(1).join(' ') || '',
          // Charger d'autres champs spécifiques au médecin si disponibles
        });
      } else {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setFormData({
            email: userInfo.email || '',
            first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || '',
            last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || '',
          });
        } else {
          Alert.alert('Erreur', 'Impossible de récupérer les informations du profil (API et local).');
        }
         console.error("API error fetching doctor profile:", await response.text());
         // Ne pas alerter si c'est juste un profil non trouvé (404), par exemple
         if (response.status !== 404) {
            Alert.alert('Erreur réseau', 'Impossible de joindre le serveur pour récupérer le profil.');
         }
      }
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération du profil.');
      // Fallback vers AsyncStorage en cas d'erreur réseau complète
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setFormData({
          email: userInfo.email || '',
          first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || '',
          last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof DoctorFormData, value: string) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Champs requis', 'Merci de remplir votre prénom et nom.');
      return;
    }

    try {
      setIsSaving(true);
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        router.replace('/doctor/auth'); // Rediriger vers la connexion médecin
        return;
      }

      const constructedFullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      const profileDataToSave = {
        fullName: constructedFullName,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        // Inclure d'autres champs spécifiques au médecin ici
      };

      const response = await fetch(`${API_URL}/doctors/profile`, { // API endpoint pour médecin
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(profileDataToSave)
      });

      if (response.ok) {
        const updatedProfileInfo = await response.json();
        const storedUserInfoString = await AsyncStorage.getItem('userInfo');
        let updatedAsyncStorageUser = { // Base de l'objet mis à jour
            ...(storedUserInfoString ? JSON.parse(storedUserInfoString) : {}),
            fullName: updatedProfileInfo.user?.fullName || constructedFullName,
            email: updatedProfileInfo.user?.email || formData.email,
            profile: {
                ...(storedUserInfoString ? JSON.parse(storedUserInfoString).profile : {}),
                ...(updatedProfileInfo.profile || {}), // Les nouvelles données du profil médecin de l'API
                first_name: profileDataToSave.first_name,
                last_name: profileDataToSave.last_name,
            }
        };

        // Si l'API retourne l'objet user complet, on peut l'utiliser
        if (updatedProfileInfo.user) {
            updatedAsyncStorageUser.id = updatedProfileInfo.user.id || updatedAsyncStorageUser.id;
            updatedAsyncStorageUser.email = updatedProfileInfo.user.email || updatedAsyncStorageUser.email;
        }
        if (updatedProfileInfo.profile) { // S'assurer que profile est bien là
             updatedAsyncStorageUser.profile = {
                ...updatedAsyncStorageUser.profile,
                ...updatedProfileInfo.profile
             };
        }
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedAsyncStorageUser));
        
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès.');
        router.back();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue lors de la mise à jour.' }));
        Alert.alert('Erreur de mise à jour', errorData.message || 'Une erreur est survenue lors de la mise à jour du profil.');
        console.error("API error updating doctor profile:", errorData);
      }
    } catch (error) {
      console.error('Failed to update doctor profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier mon profil</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.textInput}
              value={formData.first_name}
              onChangeText={(text) => handleChange('first_name', text)}
              placeholder="Entrez votre prénom"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.textInput}
              value={formData.last_name}
              onChangeText={(text) => handleChange('last_name', text)}
              placeholder="Entrez votre nom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={formData.email}
              editable={false} 
              placeholder="Adresse email"
            />
          </View>

          {/* Ajouter ici d'autres champs pour le profil médecin si nécessaire */}
          {/* Exemple: Spécialité 
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Spécialité</Text>
            <TextInput
              style={styles.textInput}
              value={formData.specialty || ''}
              onChangeText={(text) => handleChange('specialty', text)}
              placeholder="Votre spécialité (ex: Cardiologie)"
            />
          </View>
          */}

        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles repris et adaptés de EditProfileScreen patient
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Couleur de fond légèrement différente pour la zone safe
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    // borderBottomWidth: 1, // Ligne de séparation sous le header
    // borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A1E42',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10, // Ajustement pour padding vertical sur iOS
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#777',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40, // Espace en bas
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 