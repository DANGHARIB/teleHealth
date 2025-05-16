import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: Date;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<FormData, 'fullName'>>({
    email: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: new Date(),
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        router.replace('/patient/auth/Login');
        return;
      }

      const response = await fetch(`${API_URL}/patients/profile`, {
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
          gender: data.profile?.gender || 'Male',
          date_of_birth: data.profile?.date_of_birth ? new Date(data.profile.date_of_birth) : new Date(),
        });
      } else {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setFormData({
            email: userInfo.email || '',
            first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || '',
            last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || '',
            gender: userInfo.profile?.gender || 'Male',
            date_of_birth: userInfo.profile?.date_of_birth ? new Date(userInfo.profile.date_of_birth) : new Date(),
          });
        } else {
          Alert.alert('Erreur', 'Impossible de récupérer les informations du profil (API et local).');
        }
         console.error("API error fetching profile:", await response.text());
         Alert.alert('Erreur réseau', 'Impossible de joindre le serveur pour récupérer le profil.');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération du profil.');
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setFormData({
          email: userInfo.email || '',
          first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || '',
          last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || '',
          gender: userInfo.profile?.gender || 'Male',
          date_of_birth: userInfo.profile?.date_of_birth ? new Date(userInfo.profile.date_of_birth) : new Date(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Omit<FormData, 'date_of_birth' | 'gender' | 'email' | 'fullName'>, value: string) => {
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
        router.replace('/patient/auth/Login');
        return;
      }

      const constructedFullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      const profileData = {
        fullName: constructedFullName,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      };

      const response = await fetch(`${API_URL}/patients/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedProfileInfo = await response.json();
        const storedUserInfoString = await AsyncStorage.getItem('userInfo');
        let updatedAsyncStorageUser = updatedProfileInfo;

        if (storedUserInfoString) {
            const storedUserInfo = JSON.parse(storedUserInfoString);
            updatedAsyncStorageUser = {
                ...storedUserInfo, 
                fullName: updatedProfileInfo.fullName || storedUserInfo.fullName,
                email: updatedProfileInfo.email || storedUserInfo.email, 
                profile: {
                    ...(storedUserInfo.profile || {}),
                    ...(updatedProfileInfo.profile || {}),
                     first_name: updatedProfileInfo.profile?.first_name || storedUserInfo.profile?.first_name,
                     last_name: updatedProfileInfo.profile?.last_name || storedUserInfo.profile?.last_name,
                     gender: updatedProfileInfo.profile?.gender || storedUserInfo.profile?.gender,
                     date_of_birth: storedUserInfo.profile?.date_of_birth ? new Date(storedUserInfo.profile.date_of_birth) : new Date(), 
                }
            };
            if (updatedProfileInfo.first_name) updatedAsyncStorageUser.profile.first_name = updatedProfileInfo.first_name;
            if (updatedProfileInfo.last_name) updatedAsyncStorageUser.profile.last_name = updatedProfileInfo.last_name;
        }
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedAsyncStorageUser));
        
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès.');
        router.back();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue lors de la mise à jour.' }));
        Alert.alert('Erreur de mise à jour', errorData.message || 'Une erreur est survenue lors de la mise à jour du profil.');
        console.error("API error updating profile:", errorData);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
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
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Genre</Text>
            <View style={[styles.textInput, styles.disabledInput, { justifyContent: 'center' }]}>
                 <Text style={{ color: '#777' }}>{formData.gender}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date de naissance</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]} 
              value={formData.date_of_birth.toLocaleDateString()} 
              editable={false} 
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  backButton: {
    padding: 10,
    marginRight: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  textInput: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#777',
  },
  genderContainer: {
    flexDirection: 'row',
  },
  genderOption: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  genderOptionMargin: {
    marginRight: 10,
  },
  selectedGender: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F2FF',
  },
  genderText: {
    fontSize: 16,
    color: '#555',
  },
  selectedGenderText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  datePickerButton: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 