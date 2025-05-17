import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Lorem ipsum');

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        console.log("ProfileScreen focused, fetching user info...");
        try {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            
            let displayName = 'Patient';
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

          }
        } catch (error) {
          console.error("Failed to fetch user info from storage", error);
          setUserName('Patient');
        }
      };

      fetchUserInfo();

      return () => {
        // Optionnel: nettoyage si nécessaire lors du unfocus
        // console.log("ProfileScreen unfocused");
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      console.log("User token and info removed, logging out.");
      // Redirection vers le layout d'authentification patient
      router.replace('/patient/auth/login'); // Correction du chemin sans parenthèses
    } catch (error) {
      console.error("Failed to logout", error);
      router.replace('/patient/auth/login'); // Correction du chemin sans parenthèses
    }
  };

  const goToEditProfile = () => {
    console.log("Navigate to Edit Profile");
    // Navigation vers l'écran d'édition dans le groupe patient
    router.push('/patient/profile/edit'); // Correction du chemin sans parenthèses
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Profile</Text>

      <View style={styles.profileInfoContainer}>
        <View style={styles.profileIconPlaceholder} />
        
        <View style={styles.profileTextContainer}>
          <Text style={styles.greetingText}>Hi, {userName}</Text>
          <Text style={styles.welcomeText}>Welcome to Tabeeou.com</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settingsButton} onPress={goToEditProfile}>
        <Text style={styles.settingsIconPlaceholder}>⚙️</Text>
        <Text style={styles.settingsButtonText}>Edit Profil</Text>
        <Text style={styles.settingsArrow}>{'>'}</Text>
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
    textAlign: 'left',
    marginBottom: 30,
    alignSelf: 'flex-start',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextContainer: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  settingsIconPlaceholder: {
    fontSize: 24,
    marginRight: 15,
    color: '#4A4A4A',
  },
  settingsButtonText: {
    fontSize: 18,
    color: '#4A4A4A',
    flex: 1,
  },
  settingsArrow: {
    fontSize: 18,
    color: '#4A4A4A',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 30,
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
  }
}); 