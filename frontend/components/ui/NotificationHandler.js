import React, { useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NotificationContext } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Composant qui traite les notifications et gère la navigation
 * Ce composant doit être placé à un niveau où useNavigation est disponible
 */
export const NotificationHandler = () => {
  const navigation = useNavigation();
  const { 
    notificationQueue, 
    processNotificationQueue, 
    setupNotificationsIfNeeded 
  } = useContext(NotificationContext);
  
  // Configurer les notifications et traiter la file d'attente
  useEffect(() => {
    const setupAndProcess = async () => {
      try {
        // Vérifier si l'utilisateur est authentifié
        const userInfoString = await AsyncStorage.getItem('@user');
        if (!userInfoString) return;
        
        const userInfo = JSON.parse(userInfoString);
        const isAuthenticated = !!userInfo;
        const userRole = userInfo?.role || '';
        
        // Configurer les notifications si nécessaire
        await setupNotificationsIfNeeded(isAuthenticated);
        
        // Traiter les notifications en attente
        if (notificationQueue.length > 0) {
          processNotificationQueue(navigation, isAuthenticated, userRole);
        }
      } catch (error) {
        console.error('Erreur dans le gestionnaire de notifications:', error);
      }
    };
    
    setupAndProcess();
  }, [notificationQueue, navigation, processNotificationQueue, setupNotificationsIfNeeded]);
  
  // Ce composant ne rend rien, il s'agit juste d'un gestionnaire
  return null;
};

export default NotificationHandler;