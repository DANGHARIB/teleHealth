import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'; // Added Image
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { DARK_BLUE_THEME, LIGHT_BLUE_ACCENT } from '@/constants/Colors'; // Import the new colors
import Constants from 'expo-constants'; // Import Constants

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
const BASE_SERVER_URL = API_URL.replace('/api', ''); // Define base server URL

export default function DoctorProfileTabScreen() { // Renommé pour indiquer que c'est un écran d'onglet
  const router = useRouter();
  const [userName, setUserName] = useState('Lorem ipsum');
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>(undefined); // Added state for image URI

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        console.log("DoctorProfileTabScreen focused, fetching user info...");
        try {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            
            let displayName = 'Doctor'; 
            if (userInfo.fullName) {
              displayName = userInfo.fullName.trim();
            } else {
                const firstName = userInfo.profile?.first_name || '';
                const lastName = userInfo.profile?.last_name || '';
                if (firstName && lastName) {
                    displayName = `${firstName.trim()} ${lastName.trim()}`;
                } else if (firstName) {
                    displayName = firstName.trim();
                } else if (lastName) {
                    displayName = lastName.trim();
                }
            }
            setUserName(displayName);

            const imagePath = userInfo.profile?.doctor_image;
            if (imagePath && imagePath.trim() !== '') {
              // Handle both absolute paths (from older records) and relative paths
              if (imagePath.startsWith('C:') || imagePath.startsWith('/') || imagePath.startsWith('\\')) {
                // For absolute paths, extract just the filename
                const fileName = imagePath.split(/[\\\/]/).pop();
                setProfileImageUri(`${BASE_SERVER_URL}/uploads/${fileName}`);
              } else {
                // For proper relative paths
                setProfileImageUri(`${BASE_SERVER_URL}${imagePath.replace(/\\/g, '/')}`);
              }
            } else {
              setProfileImageUri(undefined);
            }

          }
        } catch (error) {
          console.error("Failed to fetch doctor info from storage", error);
          setUserName('Doctor'); 
          setProfileImageUri(undefined); // Reset on error
        }
      };

      fetchUserInfo();

      return () => {
        // console.log("DoctorProfileTabScreen unfocused");
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      console.log("User token and info removed, logging out doctor.");
      router.replace('/(doctor)/auth'); // MISE À JOUR: vers l'auth médecin
    } catch (error) {
      console.error("Failed to logout doctor", error);
      router.replace('/(doctor)/auth'); // MISE À JOUR: vers l'auth médecin
    }
  };

  const goToEditProfile = () => {
    console.log("Navigate to Edit Doctor Profile");
    router.push('/doctor/profile/edit'); // Mise à jour: redirection vers le chemin sans parenthèses
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Profile</Text>

      <View style={styles.profileInfoContainer}>
        <View style={styles.profileIconPlaceholder}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          ) : (
            <FontAwesome name="user-o" size={50} color={DARK_BLUE_THEME} />
          )}
        </View>
        
        <View style={styles.profileTextContainer}>
          <Text style={styles.greetingText}>Hi, {userName}</Text>
          <Text style={styles.welcomeText}>Welcome to Tabeebou.com</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settingsButton} onPress={goToEditProfile}>
        <FontAwesome name="cog" size={24} color={DARK_BLUE_THEME} style={styles.settingsIcon} />
        <Text style={styles.settingsButtonText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={22} color={DARK_BLUE_THEME} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/doctor/availability')}
      >
        <FontAwesome name="calendar" size={24} color={DARK_BLUE_THEME} style={styles.settingsIcon} />
        <Text style={styles.settingsButtonText}>Set Availability Slots</Text>
        <Ionicons name="chevron-forward" size={22} color={DARK_BLUE_THEME} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50, 
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME, 
    textAlign: 'left',
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  profileIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF', 
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_BLUE_THEME,
    overflow: 'hidden', // Important to clip the Image to borderRadius
  },
  profileImage: { // Style for the actual profile image
    width: '100%',
    height: '100%',
    // borderRadius is handled by the parent View with overflow: hidden
  },
  profileTextContainer: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME, 
  },
  welcomeText: {
    fontSize: 14,
    color: DARK_BLUE_THEME,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  settingsIcon: {
    marginRight: 15,
  },
  settingsButtonText: {
    fontSize: 18,
    color: LIGHT_BLUE_ACCENT,
    flex: 1,
  },
  settingsArrow: {
    fontSize: 18,
    color: DARK_BLUE_THEME,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: LIGHT_BLUE_ACCENT,
    borderRadius: 8,
    minWidth: '50%',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  }
}); 