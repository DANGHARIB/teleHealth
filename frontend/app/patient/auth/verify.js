import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

const VerifyScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(59);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Initialize the countdown timer
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
    // Only accept digits
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    
    // Auto-focus next input
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (index, e) => {
    // Move to previous input on backspace when empty
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
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: code
      });
      
      if (response.data && response.data.token) {
        // Store user info and token
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
        
        // Navigate to patient verified screen
        router.push({
          pathname: '/patient/auth/verified',
          params: { email }
        });
      } else {
        // Handle cases where token might be missing in response, though backend should always send it on success
        setError(response.data?.message || 'Verification failed, token not received.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      // Implement your resend code logic here
      await axios.post(`${API_URL}/auth/resend-otp`, { email });
      
      // Reset the timer
      setTimer(59);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter the verify code</Text>
        <Text style={styles.subtitle}>We just send you a verification code via email</Text>
        
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