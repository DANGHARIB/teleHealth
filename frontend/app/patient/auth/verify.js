import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utiliser la variable d'environnement définie dans .env
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:5000/api';
console.log('URL API utilisée pour vérification OTP:', API_URL);

const VerifyScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(59);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 4) {
      setError('Please enter the 4-digit code');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      console.log(`Tentative de vérification OTP: ${code} pour l'email: ${email}`);
      
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: code,
        role: 'Patient'
      });
      
      console.log('Réponse de vérification OTP:', JSON.stringify(response.data));
      
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        
        // S'assurer que userInfo inclut le rôle et autres infos nécessaires
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
        
        router.push({
          pathname: '/patient/auth/verified',
          params: { email }
        });
      } else {
        console.log('Token manquant dans la réponse OTP:', response.data);
        setError(response.data?.message || 'Verification failed, token not received.');
      }
    } catch (error) {
      console.error('Erreur de vérification OTP:', error.message);
      if (error.response) {
        console.error('Détails de l\'erreur OTP:', JSON.stringify(error.response.data));
      }
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      console.log(`Tentative de renvoi de code OTP pour l'email: ${email}`);
      await axios.post(`${API_URL}/auth/resend-otp`, { email, role: 'Patient' });
      setTimer(59);
      setError('');
      console.log('Code OTP renvoyé avec succès');
    } catch (error) {
      console.error('Erreur lors du renvoi du code:', error.message);
      setError(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter the verify code</Text>
        <Text style={styles.subtitle}>We just send you a verification code via email {typeof email === 'string' ? email : ''}</Text>
        
        <View style={styles.otpContainer}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              maxLength={1}
              keyboardType="numeric"
              value={otpCode[index]}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={(e) => handleKeyPress(index, e)}
            />
          ))}
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleVerifyOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.timerText}>
          The verify code will expire in {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
        </Text>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={timer > 0 || isLoading}
        >
          <Text style={[
            styles.resendText,
            (timer > 0 || isLoading) && styles.disabledText
          ]}>
            Resend Code
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A1E42',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 50,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A1E42',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#7BAFD4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 16,
    color: '#666',
    marginTop: 30,
    marginBottom: 10,
  },
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: '#7BAFD4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default VerifyScreen; 