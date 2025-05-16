import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PatientAuthScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.subtitle}>TABEEBOU.COM</Text>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>CONVENIENT CROSS BORDERS</Text>
          <Text style={styles.description}>TELEHEALTH SOLUTION</Text>
          <Text style={styles.description}>JUST FOR YOU</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/patient/auth/login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/patient/auth/signup')}
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
    backgroundColor: '#7BAFD4',
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
    color: '#9BBEDB',
    marginBottom: 5,
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

export default PatientAuthScreen; 