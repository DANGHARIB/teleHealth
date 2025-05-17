import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, Alert, Platform, Image, KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  DARK_BLUE_THEME, LIGHT_BLUE_ACCENT, BUTTON_COLOR, WHITE_COLOR, 
  BACKGROUND_COLOR, PRIMARY_COLOR, SECONDARY_COLOR 
} from '@/constants/Colors';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
const BASE_SERVER_URL = API_URL.replace('/api', ''); // Define base server URL

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

interface DoctorFormData {
  email: string;
  first_name: string;
  last_name: string;
  about?: string;
  education?: string;
  experience?: string; // Stored as string in form, converted to number on save
  price?: string;      // Stored as string in form, converted to number on save
  doctor_image_url?: string; // To display current image
}

export default function EditDoctorProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>({
    email: '',
    first_name: '',
    last_name: '',
    about: '',
    education: '',
    experience: '',
    price: '',
    doctor_image_url: undefined,
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        router.replace('/doctor/auth'); // Redirect to doctor login
        return;
      }

      const response = await fetch(`${API_URL}/doctors/profile`, { // API endpoint for doctor
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const imagePath = data.profile?.doctor_image;
        setFormData({
          email: data.user?.email || '',
          first_name: data.profile?.first_name || data.user?.fullName?.split(' ')[0] || '',
          last_name: data.profile?.last_name || data.user?.fullName?.split(' ').slice(1).join(' ') || '',
          about: data.profile?.about || '',
          education: data.profile?.education || '',
          experience: data.profile?.experience?.toString() || '',
          price: data.profile?.price?.toString() || '',
          doctor_image_url: getImageUrl(imagePath),
        });
      } else {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          const imagePath = userInfo.profile?.doctor_image;
          setFormData(prev => ({ // Merge with potentially partially loaded data
            ...prev,
            email: userInfo.email || prev.email || '',
            first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || prev.first_name || '',
            last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || prev.last_name || '',
            about: userInfo.profile?.about || prev.about || '', // Match the backend field name
            education: userInfo.profile?.education || prev.education || '',
            experience: userInfo.profile?.experience?.toString() || prev.experience || '',
            price: userInfo.profile?.price?.toString() || prev.price || '', // Match the backend field name
            doctor_image_url: getImageUrl(imagePath),
          }));
        } else {
          Alert.alert('Error', 'Could not retrieve profile information (API and local).');
        }
         console.error("API error fetching doctor profile:", await response.text());
         // Do not alert if it's just a profile not found (404), for example
         if (response.status !== 404) {
            Alert.alert('Network Error', 'Could not connect to the server to retrieve the profile.');
         }
      }
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
      Alert.alert('Error', 'An error occurred while retrieving the profile.');
      // Fallback to AsyncStorage in case of complete network error
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        const imagePath = userInfo.profile?.doctor_image;
        setFormData(prev => ({ // Merge with potentially partially loaded data
            ...prev,
            email: userInfo.email || prev.email || '',
            first_name: userInfo.profile?.first_name || userInfo.fullName?.split(' ')[0] || prev.first_name || '',
            last_name: userInfo.profile?.last_name || userInfo.fullName?.split(' ').slice(1).join(' ') || prev.last_name || '',
            about: userInfo.profile?.about || prev.about || '', // Match the backend field name
            education: userInfo.profile?.education || prev.education || '',
            experience: userInfo.profile?.experience?.toString() || prev.experience || '',
            price: userInfo.profile?.price?.toString() || prev.price || '', // Match the backend field name
            doctor_image_url: getImageUrl(imagePath),
        }));
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

  const handleImageUpload = async () => {
    setIsUploadingImage(true);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera roll is required!");
      setIsUploadingImage(false);
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (pickerResult.canceled) {
      setIsUploadingImage(false);
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const imageUri = pickerResult.assets[0].uri;
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Session Expired', 'Please log in again to upload images.');
        setIsUploadingImage(false);
        return;
      }

      const localFormData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /.(\w+)$/.exec(filename!);
      const type = match ? `image/${match[1]}` : `image`;
      
      localFormData.append('image', { uri: imageUri, name: filename, type } as any);

      try {
        const response = await fetch(`${API_URL}/doctors/upload-image`, {
          method: 'PUT',
          body: localFormData,
          headers: {
            'Authorization': `Bearer ${userToken}`,
            // 'Content-Type': 'multipart/form-data' is set automatically by fetch with FormData
          },
        });

        const responseData = await response.json();

        if (response.ok && responseData.doctor && responseData.doctor.doctor_image) {
          // Get the relative image path from the response
          const imagePath = responseData.doctor.doctor_image;
          // Use our helper function to create a proper URL
          const newFullImageUrl = getImageUrl(imagePath);
          setFormData(prev => ({ ...prev, doctor_image_url: newFullImageUrl }));
          
          const storedUserInfoString = await AsyncStorage.getItem('userInfo');
          if (storedUserInfoString) {
            const storedUserInfo = JSON.parse(storedUserInfoString);
            storedUserInfo.profile = {
              ...storedUserInfo.profile,
              doctor_image: imagePath
            };
            await AsyncStorage.setItem('userInfo', JSON.stringify(storedUserInfo));
          }
        } else {
          Alert.alert("Upload Failed", responseData.message || "Could not upload image.");
        }
      } catch (err) {
        console.error("Image upload error:", err);
        Alert.alert("Upload Error", "An error occurred while uploading the image.");
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      setIsUploadingImage(false); // No assets selected or other issue
    }
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Required Fields', 'Please fill in your first and last name.');
      return;
    }

    // Validate numeric fields
    const experienceNum = parseFloat(formData.experience || '0');
    const priceNum = parseFloat(formData.price || '0');

    if (formData.experience && isNaN(experienceNum)) {
      Alert.alert('Invalid Input', 'Please enter a valid number for experience.');
      return;
    }
    if (formData.price && isNaN(priceNum)) {
      Alert.alert('Invalid Input', 'Please enter a valid number for consultation fee.');
      return;
    }

    try {
      setIsSaving(true);
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/doctor/auth'); // Redirect to doctor login
        return;
      }

      const constructedFullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      const profileDataToSave: any = {
        fullName: constructedFullName, // This updates User.fullName
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        bio: formData.about?.trim(), // Mapped to 'about' field in the model
        education: formData.education?.trim(),
        experience: formData.experience ? experienceNum : undefined,
        price: formData.price ? priceNum : undefined, // Mapped to 'price' field in the model
      };
      
      // Remove undefined fields to avoid sending them
      Object.keys(profileDataToSave).forEach(key => {
        if (profileDataToSave[key] === undefined) {
          delete profileDataToSave[key];
        }
      });

      const response = await fetch(`${API_URL}/doctors/profile`, { // API endpoint for doctor
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
        let currentUserInfo = storedUserInfoString ? JSON.parse(storedUserInfoString) : {};

        // Determine the correct doctor_image path
        let finalDoctorImagePath = null;
        if (updatedProfileInfo.profile?.doctor_image && updatedProfileInfo.profile.doctor_image.trim() !== '') {
          finalDoctorImagePath = updatedProfileInfo.profile.doctor_image;
        } else if (currentUserInfo.profile?.doctor_image && currentUserInfo.profile.doctor_image.trim() !== '') {
          finalDoctorImagePath = currentUserInfo.profile.doctor_image;
        }

        let updatedAsyncStorageUser = {
            ...currentUserInfo,
            fullName: updatedProfileInfo.user?.fullName || constructedFullName,
            email: updatedProfileInfo.user?.email || formData.email,
            profile: {
                ...currentUserInfo.profile,
                ...(updatedProfileInfo.profile || {}), 
                first_name: profileDataToSave.first_name,
                last_name: profileDataToSave.last_name,
                about: profileDataToSave.bio, 
                education: profileDataToSave.education,
                experience: profileDataToSave.experience,
                price: profileDataToSave.price,
                doctor_image: finalDoctorImagePath,
            }
        };

        if (updatedProfileInfo.user) {
            updatedAsyncStorageUser.id = updatedProfileInfo.user.id || updatedAsyncStorageUser.id;
            updatedAsyncStorageUser.email = updatedProfileInfo.user.email || updatedAsyncStorageUser.email;
        }
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedAsyncStorageUser));
        
        Alert.alert('Success', 'Your profile has been updated successfully.');
        router.back();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error during update.' }));
        Alert.alert('Update Error', errorData.message || 'An error occurred while updating the profile.');
        console.error("API error updating doctor profile:", errorData);
      }
    } catch (error) {
      console.error('Failed to update doctor profile:', error);
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={DARK_BLUE_THEME} />
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
            <Ionicons name="chevron-back" size={28} color={DARK_BLUE_THEME} />
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
              {formData.doctor_image_url ? (
                <Image 
                  source={{ uri: formData.doctor_image_url }} 
                  style={styles.profileImagePreview} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <FontAwesome5 name="user-md" size={50} color={LIGHT_BLUE_ACCENT} />
                </View>
              )}
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={handleImageUpload}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={WHITE_COLOR} />
                ) : (
                  <Ionicons name="camera" size={22} color={WHITE_COLOR} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={22} color={DARK_BLUE_THEME} />
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
                <Ionicons name="mail" size={20} color={SECONDARY_COLOR} style={styles.inputIcon} />
                <Text style={styles.disabledInputText}>{formData.email}</Text>
              </View>
            </View>
          </View>

          {/* Professional Information Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="work" size={22} color={DARK_BLUE_THEME} />
              <Text style={styles.cardTitle}>Professional Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>About Me</Text>
              <TextInput
                style={[styles.textInput, styles.multilineTextInput]}
                value={formData.about}
                onChangeText={(text) => handleChange('about', text)}
                placeholder="Tell patients about yourself, specialties, and approach to care"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Education & Qualifications</Text>
              <TextInput
                style={[styles.textInput, styles.multilineTextInput]}
                value={formData.education}
                onChangeText={(text) => handleChange('education', text)}
                placeholder="List your degrees, certifications, and institutions"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.inputLabel}>Experience (Years)</Text>
                <TextInput
                  style={[styles.textInput, {paddingLeft: 40}]}
                  value={formData.experience}
                  onChangeText={(text) => handleChange('experience', text)}
                  placeholder="Years"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <MaterialIcons name="timeline" size={20} color={DARK_BLUE_THEME} style={styles.inputIcon} />
              </View>
              
              <View style={[styles.inputGroup, {flex: 1, marginLeft: 10}]}>
                <Text style={styles.inputLabel}>Consultation Fee</Text>
                <TextInput
                  style={[styles.textInput, {paddingLeft: 40}]}
                  value={formData.price}
                  onChangeText={(text) => handleChange('price', text)}
                  placeholder="Amount"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <MaterialIcons name="attach-money" size={20} color={DARK_BLUE_THEME} style={styles.inputIcon} />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, (isSaving || isLoading) && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={WHITE_COLOR} />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color={WHITE_COLOR} style={styles.buttonIcon} />
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
    backgroundColor: WHITE_COLOR,
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
    backgroundColor: BACKGROUND_COLOR,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DARK_BLUE_THEME,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: WHITE_COLOR,
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
    color: DARK_BLUE_THEME,
    textAlign: 'center',
  },
  // New image section styles
  imageSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    borderWidth: 3,
    borderColor: WHITE_COLOR,
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    borderWidth: 3,
    borderColor: WHITE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: LIGHT_BLUE_ACCENT,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: WHITE_COLOR,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // Card styles
  formCard: {
    backgroundColor: WHITE_COLOR,
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
    color: DARK_BLUE_THEME,
    marginLeft: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DARK_BLUE_THEME,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    backgroundColor: WHITE_COLOR,
    color: DARK_BLUE_THEME,
  },
  inputIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 38 : 34,
    left: 12,
    zIndex: 1,
  },
  multilineTextInput: {
    minHeight: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: 12,
    textAlignVertical: 'top',
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
    color: SECONDARY_COLOR,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: LIGHT_BLUE_ACCENT,
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
    color: WHITE_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 