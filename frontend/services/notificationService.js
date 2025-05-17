import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

/**
 * Configure les notifications pour l'application
 */
export const configureNotifications = async () => {
  try {
    // Vérifier les permissions des notifications (Android uniquement)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Demander la permission d'envoyer des notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permission de notification non accordée!');
      return false;
    }

    // Obtenir le token de l'appareil et l'enregistrer
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('projectId non disponible');
      return false;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    // Enregistrer le token sur l'appareil
    await AsyncStorage.setItem('pushToken', token.data);
    
    // Envoyer le token au backend
    try {
      await registerDeviceToken(token.data);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration des notifications:', error);
    return false;
  }
};

/**
 * Enregistre le token de l'appareil auprès du backend
 */
export const registerDeviceToken = async (token) => {
  try {
    const response = await api.post('/api/users/device-token', { token });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du token auprès du serveur:', error);
    throw error;
  }
};

/**
 * Gérer la réception d'une notification
 */
export const handleNotificationReceived = (notification) => {
  const { data } = notification.request.content;
  console.log('Notification reçue:', data);
  
  // Gérer les différents types de notifications
  switch (data.type) {
    case 'new_appointment':
      // Action quand un nouveau rendez-vous est créé
      break;
    case 'confirmed_appointment':
      // Action quand un rendez-vous est confirmé
      break;
    case 'rescheduled_appointment':
      // Action quand un rendez-vous est reprogrammé
      break;
    case 'cancelled_appointment':
      // Action quand un rendez-vous est annulé
      break;
    case 'appointment_reminder':
      // Action quand un rappel de rendez-vous est envoyé
      break;
    case 'payment_received':
      // Action quand un paiement est reçu
      break;
    default:
      // Gestion par défaut
      break;
  }
  
  return true;
};

/**
 * Configurer les gestionnaires de notifications
 */
export const setupNotificationHandlers = () => {
  // Configurer le gestionnaire pour les notifications reçues quand l'app est en premier plan
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Configurer le gestionnaire pour les notifications reçues
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    handleNotificationReceived(notification);
  });
  
  // Configurer le gestionnaire pour les notifications sur lesquelles on a appuyé
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    // On peut naviguer vers un écran spécifique ici
    handleNotificationResponse(response);
  });
  
  // Retourner une fonction pour nettoyer les abonnements
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

/**
 * Gérer l'appui sur une notification
 */
const handleNotificationResponse = (response) => {
  const { data } = response.notification.request.content;
  console.log('Notification appuyée:', data);
  
  // Navigation vers l'écran approprié en fonction du type de notification
  // Ceci devrait être géré par le composant qui utilise ce service
  
  return true;
};

/**
 * Envoyer une notification locale (pour les tests)
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Afficher immédiatement
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification locale:', error);
    return false;
  }
};

export default {
  configureNotifications,
  registerDeviceToken,
  handleNotificationReceived,
  setupNotificationHandlers,
  sendLocalNotification,
}; 