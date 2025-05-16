import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import axios from 'axios'; // Or use your global api instance from services

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.106:5000/api';

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
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
        
        if (response.data.role === 'Doctor') {
          router.replace('/doctor/dashboard'); // Redirection vers le tableau de bord docteur
        } else {
          setError('Access denied. This login is for doctors only.');
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userInfo');
        }
      } else {
        setError(response.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#0A1E42" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          {/* <Image source={require('../../assets/images/doctor-icon.png')} style={styles.logo} /> */}
          <Text style={styles.title}>Doctor Login</Text>
          <Text style={styles.subtitle}>Welcome back, Doctor!</Text>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#7BAFD4" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="doctor.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#7BAFD4" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#7BAFD4" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>LOGIN</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/doctor/auth/signup')}>
          <Text style={styles.footerLinkText}>Don&apos;t have an account? <Text style={styles.boldLink}>Sign Up</Text></Text>
        </TouchableOpacity>
         {/* <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/auth/forgot-password')}> // Optional: Forgot Password
          <Text style={styles.footerLinkText}><Text style={styles.boldLink}>Forgot Password?</Text></Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 1 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0A1E42', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
    borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#0A1E42' },
  eyeIcon: { padding: 5 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 20 },
  loginButton: {
    backgroundColor: '#7BAFD4', paddingVertical: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 10, marginBottom: 20
  },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footerLink: { alignItems: 'center', marginTop: 15 },
  footerLinkText: { fontSize: 14, color: '#666' },
  boldLink: { fontWeight: 'bold', color: '#7BAFD4' },
});

export default DoctorLoginScreen; 