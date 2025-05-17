import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// Utiliser la variable d'environnement définie dans .env
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:5000/api';
console.log('URL API utilisée:', API_URL);

const LoginScreen = () => {
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
      console.log('Tentative de connexion avec:', email);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        role: 'Patient'
      });
      
      console.log('Réponse du serveur:', JSON.stringify(response.data));
      
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        
        // Vérifier la structure des données renvoyées
        let userInfoToStore = {};
        
        if (response.data.user) {
          userInfoToStore = { ...response.data.user, role: response.data.user.role || 'Patient' };
        } else {
          // Si user n'existe pas dans la réponse, créons une structure minimale
          userInfoToStore = { 
            email: email,
            role: 'Patient',
            ...response.data // Inclure toutes les autres données
          };
        }
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoToStore));
        
        // Vérifier si l'utilisateur a complété son évaluation (hasCompletedAssessment est défini par le serveur)
        const hasCompletedAssessment = userInfoToStore.hasCompletedAssessment === true;
        
        if (hasCompletedAssessment) {
          // Si l'évaluation est complétée, aller directement à la page de profil
          router.replace('/(patient)/(tabs)/profile');
        } else {
          // Si l'évaluation n'est pas complétée, rediriger vers l'écran d'évaluation
          router.replace('/patient/assessment');
        }
      } else {
        console.log('Token manquant dans la réponse:', response.data);
        setError(response.data?.message || 'Login failed, please try again.');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err.message);
      if (err.response) {
        console.error('Détails de l\'erreur:', JSON.stringify(err.response.data));
      }
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()} // Ou router.replace('/') pour aller à la racine
      >
        <Ionicons name="arrow-back" size={24} color="#0A1E42" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Patient!</Text>

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
          onPress={() => router.push('/patient/auth/signup')}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A1E42',
    marginVertical: 40,
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

export default LoginScreen; 