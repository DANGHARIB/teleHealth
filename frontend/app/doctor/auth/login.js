import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../services/api'; // Utilisation de l'instance api globale

const DoctorLoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { // Utilisation de api au lieu de axios.post avec URL complète
        email,
        password,
        role: 'Doctor' // Ajout du rôle
      });
      
      if (response.data && response.data.token) {
        // La réponse inclut déjà userInfo, donc nous pouvons le stocker directement
        // et le rôle est également dans response.data.role
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data)); // Stocker l'objet utilisateur complet
        
        // Vérification du rôle déjà effectuée dans le backend et retournée, mais une double vérification ici est acceptable
        if (response.data.role === 'Doctor') {
          // Rediriger vers la racine du groupe (doctor) après connexion réussie
          router.replace('/(doctor)/(tabs)'); 
        } else {
          setError('Access denied. This login is for doctors only.');
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userInfo');
        }
      } else {
        setError(response.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // S'assurer que err.response et err.response.data existent avant d'y accéder
      let errorMessage = 'Login failed. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()} // router.back() est généralement géré par la navigation Stack
      >
        <Ionicons name="arrow-back" size={24} color="#0A1E42" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Doctor!</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={24} color="#7BAFD4" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color="#7BAFD4" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.passwordToggle} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#7BAFD4" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpLink}
          onPress={() => router.push('./signup')} // Chemin relatif
        >
          <Ionicons name="chevron-back" size={18} color="#7BAFD4" />
          <Text style={styles.signUpText}>Don&apos;t have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    // position: 'absolute', // Pourrait être nécessaire si le contenu scrolle en dessous
    // top: 10, 
    // left: 10,
    // zIndex: 1, 
  },
  content: {
    flex: 1,
    // paddingTop: 60, // Ajuster si le backButton est absolute
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A1E42',
    marginVertical: 40, // Peut nécessiter ajustement si backButton est absolute
    // textAlign: 'center', // Optionnel, pour centrer
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 25,
    paddingBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0A1E42',
  },
  passwordToggle: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#7BAFD4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#7BAFD4',
    fontSize: 16,
  },
});

export default DoctorLoginScreen; 