import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'; // Image retiré car non utilisé ici
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

export default function DoctorProfileTabScreen() { // Renommé pour indiquer que c'est un écran d'onglet
  const router = useRouter();
  const [userName, setUserName] = useState('Lorem ipsum');

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

          }
        } catch (error) {
          console.error("Failed to fetch doctor info from storage", error);
          setUserName('Doctor'); 
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
            <FontAwesome name="user-md" size={40} color="#777" /> {/* Couleur ajustée */}
        </View>
        
        <View style={styles.profileTextContainer}>
          <Text style={styles.greetingText}>Hi, {userName}</Text>
          <Text style={styles.welcomeText}>Welcome to Tabeeou.com</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settingsButton} onPress={goToEditProfile}>
        <FontAwesome name="cog" size={24} color="#4A4A4A" style={styles.settingsIcon} />
        <Text style={styles.settingsButtonText}>Edit Profile</Text>
        <Text style={styles.settingsArrow}>{'>'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/doctor/availability')}
      >
        <FontAwesome name="calendar" size={24} color="#4A4A4A" style={styles.settingsIcon} />
        <Text style={styles.settingsButtonText}>Set Availability Slots</Text>
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
    color: '#0A1E42', 
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
    backgroundColor: '#E9E9E9', // Légère variation de couleur pour la différencier si besoin
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0A1E42',
  },
  profileTextContainer: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A1E42', 
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
  settingsIcon: {
    marginRight: 15,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
  }
}); 