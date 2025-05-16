import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.106:5000/api';

// Création d'une instance Axios avec la configuration de base
const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
authApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  // Inscription d'un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await authApi.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  },

  // Vérification du code OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await authApi.post('/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Code OTP invalide' };
    }
  },

  // Renvoi du code OTP
  resendOtp: async (email) => {
    try {
      const response = await authApi.post('/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du renvoi du code' };
    }
  },

  // Connexion
  login: async (credentials) => {
    try {
      const response = await authApi.post('/login', credentials);
      
      // Stocker le token et les infos utilisateur
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Identifiants incorrects' };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  },

  // Vérifier si l'utilisateur est connecté
  isLoggedIn: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Récupérer les informations de l'utilisateur
  getUserInfo: async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      return null;
    }
  }
};

export default authService; 