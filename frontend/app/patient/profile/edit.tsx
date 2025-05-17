import React, { useState, useEffect } from 'react';
import {
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Platform, 
  Image, 
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Color scheme matching the app
const COLORS = {
  primary: '#7AA7CC',
  primaryLight: '#8FB5D5',
  primaryDark: '#6999BE',
  darkBlue: '#090F47',
  white: '#FFFFFF',
  background: '#FAFBFE',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  danger: '#EF4444',
  secondary: '#64748B',
};

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
        router.replace('/patient/auth/login');
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
          Alert.alert('Error', 'Could not retrieve profile information (API and local).');
        }
         console.error("API error fetching profile:", await response.text());
         if (response.status !== 404) {
           Alert.alert('Network Error', 'Could not connect to the server to retrieve the profile.');
         }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'An error occurred while retrieving the profile.');
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
      Alert.alert('Required Fields', 'Please fill in your first and last name.');
      return;
    }

    try {
      setIsSaving(true);
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/patient/auth/login');
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
        
        Alert.alert('Success', 'Your profile has been updated successfully.');
        router.back();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error during update.' }));
        Alert.alert('Update Error', errorData.message || 'An error occurred while updating the profile.');
        console.error("API error updating profile:", errorData);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.darkBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerButton} />
        </View>
        
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImagePlaceholder}>
                <FontAwesome5 name="user" size={50} color={COLORS.primaryLight} />
              </View>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={22} color={COLORS.darkBlue} />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.first_name}
                  onChangeText={(text) => handleChange('first_name', text)}
                  placeholder="First name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.last_name}
                  onChangeText={(text) => handleChange('last_name', text)}
                  placeholder="Last name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.disabledInputContainer}>
                <Ionicons name="mail" size={20} color={COLORS.secondary} style={styles.inputIcon} />
                <Text style={styles.disabledInputText}>{formData.email}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.disabledInputContainer}>
                <Ionicons name="person" size={20} color={COLORS.secondary} style={styles.inputIcon} />
                <Text style={styles.disabledInputText}>{formData.gender}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.disabledInputContainer}>
                <Ionicons name="calendar" size={20} color={COLORS.secondary} style={styles.inputIcon} />
                <Text style={styles.disabledInputText}>
                  {formData.date_of_birth.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, (isSaving || isLoading) && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    textAlign: 'center',
  },
  // Image section styles
  imageSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  // Card styles
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginLeft: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.darkBlue,
  },
  inputIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 14 : 12,
    left: 12,
    zIndex: 1,
  },
  disabledInputContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingLeft: 40,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledInputText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 