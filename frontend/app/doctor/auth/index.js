import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const DoctorAuthScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome Doctor</Text>
        <Text style={styles.subtitle}>TABEEBOU.COM</Text>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>MANAGE YOUR PATIENTS</Text>
          <Text style={styles.description}>AND APPOINTMENTS EFFICIENTLY</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/doctor/auth/login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/doctor/auth/signup')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7BAFD4', // Doctor theme color or same as patient
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A1E42',
    marginBottom: 20,
  },
  descriptionContainer: {
    alignItems: 'center',
  },
  description: {
    fontSize: 18,
    color: '#9BBEDB', // Lighter shade for description
    marginBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  button: {
    backgroundColor: '#7BAFD4', 
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'white',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DoctorAuthScreen; 