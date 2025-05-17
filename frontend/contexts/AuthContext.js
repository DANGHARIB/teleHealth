import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Créer le contexte d'authentification
const AuthContext = createContext({});

// Fonction hook pour accéder au contexte
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Charger l'utilisateur depuis le stockage local au démarrage
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@user');
        const storedToken = await AsyncStorage.getItem('@token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
          
          // Configurer le token dans l'API
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'authentification:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredUser();
  }, []);

  // Fonction de connexion
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      // Stocker les données d'authentification dans le stockage local
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      await AsyncStorage.setItem('@token', token);
      
      // Mettre à jour l'état et configurer le token dans l'API
      setUser(userData);
      setAuthToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de connexion'
      };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const signUp = async (userData) => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/auth/register', userData);
      return { 
        success: true, 
        user: response.data.user
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur d\'inscription'
      };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      // Supprimer les données d'authentification du stockage local
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@token');
      
      // Réinitialiser l'état
      setUser(null);
      setAuthToken(null);
      
      // Supprimer le token de l'API
      delete api.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return { success: false, error: 'Erreur de déconnexion' };
    }
  };

  // Mettre à jour les informations de l'utilisateur
  const updateUserProfile = async (updatedData) => {
    try {
      setLoading(true);
      
      const response = await api.put('/api/users/profile', updatedData);
      const updatedUser = response.data;
      
      // Mettre à jour le stockage local
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      
      // Mettre à jour l'état
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur de mise à jour du profil'
      };
    } finally {
      setLoading(false);
    }
  };

  // Valeur du contexte à partager
  const authContextValue = {
    user,
    authToken,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 