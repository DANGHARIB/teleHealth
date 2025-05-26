import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_TYPE_KEY } from '../../../constants/StorageKeys';
import doctorAuthService from '../../../services/doctorAuthService';

const AccountUnderReviewScreen = () => {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fonction pour vérifier le statut du compte
  const checkAccountStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await doctorAuthService.checkVerificationStatus();
      setVerificationStatus(result.status);
      
      if (result.rejectionReason) {
        setRejectionReason(result.rejectionReason);
      }
      
      setError('');
    } catch (err) {
      console.error('Erreur lors de la vérification du statut:', err);
      setError("Impossible de vérifier le statut de votre compte. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérifier le statut périodiquement
  useEffect(() => {
    // Vérification initiale
    checkAccountStatus();
    
    // Configurer une vérification périodique
    const intervalId = setInterval(checkAccountStatus, 30000); // Vérifier toutes les 30 secondes
    
    // Nettoyer l'intervalle à la destruction du composant
    return () => clearInterval(intervalId);
  }, [checkAccountStatus]);
  
  // Gérer la redirection vers la page d'accueil quand le médecin est vérifié
  const handleLoginPress = async () => {
    try {
      await AsyncStorage.setItem(USER_TYPE_KEY, 'doctor');
      router.replace('/doctor/auth/login');
    } catch (err) {
      console.error('Erreur lors de la navigation:', err);
    }
  };
  
  // Gérer la redirection vers la page d'inscription quand le médecin est rejeté
  const handleTryAgainPress = async () => {
    try {
      // Supprimer toutes les données stockées pour recommencer à zéro
      await AsyncStorage.removeItem(USER_TYPE_KEY);
      router.replace('/doctor/auth/signup');
    } catch (err) {
      console.error('Erreur lors de la navigation:', err);
    }
  };

  // Afficher l'écran approprié en fonction du statut de vérification
  if (verificationStatus === 'verified') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" style={styles.icon} />
          <Text style={styles.title}>Votre compte a été vérifié!</Text>
          <Text style={styles.message}>
            Félicitations! Votre compte médecin a été approuvé. Vous pouvez maintenant vous connecter pour commencer à utiliser la plateforme.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (verificationStatus === 'rejected') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="close-circle" size={64} color="#F44336" style={styles.icon} />
          <Text style={styles.title}>Votre demande a été refusée</Text>
          <Text style={styles.message}>
            Nous avons examiné votre demande de compte médecin et nous sommes désolés de vous informer qu'elle n'a pas été approuvée.
            {rejectionReason ? `\n\nRaison: ${rejectionReason}` : ''}
          </Text>
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgainPress}>
            <Text style={styles.tryAgainButtonText}>Essayer avec un nouveau compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // État par défaut - En attente
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#0A1E42" style={styles.spinner} />
        ) : error ? (
          <Ionicons name="alert-circle" size={64} color="#F57C00" style={styles.icon} />
        ) : (
          <Ionicons name="hourglass-outline" size={64} color="#0A1E42" style={styles.icon} />
        )}
        
        <Text style={styles.title}>
          {error ? "Erreur de connexion" : "Votre compte est en cours d'examen"}
        </Text>
        
        <Text style={styles.message}>
          {error ? error : 
            "Vous recevrez un email avec une confirmation une fois l'examen terminé ou, si nécessaire, un email vous demandant des informations supplémentaires ou vous informant de tout problème."}
        </Text>
        
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={checkAccountStatus}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        )}
        
        {!error && !loading && (
          <Text style={styles.thankYouMessage}>Merci de votre patience!</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 30,
    alignItems: 'center',
    maxWidth: 500, // Pour une meilleure lisibilité sur les grands écrans
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1E42',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  thankYouMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#7BAFD4',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '80%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tryAgainButton: {
    backgroundColor: '#F44336',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '80%',
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#0A1E42',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '80%',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AccountUnderReviewScreen; 