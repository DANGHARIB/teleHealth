import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  configureNotifications, 
  setupNotificationHandlers, 
  sendLocalNotification 
} from '../services/notificationService';
import { notificationsAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NotificationContext = createContext();

// Clé pour le stockage local des notifications
const NOTIFICATION_STORAGE_KEY = '@notifications';

export const NotificationProvider = ({ children }) => {
  const [isNotificationsConfigured, setIsNotificationsConfigured] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configurer les notifications
  const setupNotificationsIfNeeded = async (isUserAuthenticated) => {
    console.log('NotificationContext - Setting up notifications, isAuthenticated:', isUserAuthenticated);
    if (isUserAuthenticated && !isNotificationsConfigured) {
      try {
        const success = await configureNotifications();
        console.log('NotificationContext - Configuration result:', success);
        setIsNotificationsConfigured(success);
        
        if (!success) {
          Alert.alert(
            'Notification',
            'Les notifications sont désactivées. Certaines fonctionnalités peuvent être limitées.',
            [{ text: 'OK' }]
          );
        }
        return success;
      } catch (error) {
        console.error('Erreur lors de la configuration des notifications:', error);
        return false;
      }
    }
    return isNotificationsConfigured;
  };

  // Récupérer les notifications depuis le backend
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    console.log('NotificationContext - Fetching notifications from backend, page:', page, 'limit:', limit);
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer les notifications depuis l'API
      const response = await notificationsAPI.getNotifications(page, limit);
      console.log('NotificationContext - API Response:', response);
      
      // Vérifier la structure de la réponse et extraire les données correctement
      const notificationData = response.data?.data || response.data || [];
      console.log('NotificationContext - Notifications extracted:', notificationData.length);
      
      // Si c'est la première page, remplacer les notifications, sinon ajouter à la liste existante
      if (page === 1) {
        setNotifications(notificationData);
      } else {
        setNotifications(prev => [...prev, ...notificationData]);
      }
      
      // Enregistrer les notifications dans le stockage local
      await saveNotificationsToStorage(notificationData);
      
      // Mettre à jour le compteur de notifications non lues
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      } else {
        fetchUnreadCount();
      }
      
      return {
        ...response,
        data: notificationData
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      setError(error.message || 'Impossible de récupérer les notifications');
      
      // En cas d'échec, utiliser le stockage local comme fallback
      const cachedNotifications = await loadNotificationsFromStorage();
      if (cachedNotifications && cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
      }
      
      return { data: [] };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUnreadCount]);

  // Récupérer le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      return 0;
    }
  }, []);

  // Marquer une notification comme lue
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Mettre à jour le compteur de notifications non lues
      fetchUnreadCount();
      
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  }, [fetchUnreadCount]);

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      
      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Mettre à jour le compteur de notifications non lues
      fetchUnreadCount();
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  }, [fetchUnreadCount]);

  // Effacer toutes les notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.clearAllNotifications();
      
      // Mettre à jour l'état local
      setNotifications([]);
      
      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
      return false;
    }
  }, []);

  // Sauvegarder les notifications dans le stockage local
  const saveNotificationsToStorage = async (notifs) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifs));
      console.log('NotificationContext - Notifications saved to storage:', notifs.length);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications dans le stockage:', error);
    }
  };

  // Charger les notifications depuis le stockage local
  const loadNotificationsFromStorage = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        console.log('NotificationContext - Notifications loaded from storage:', parsedNotifications.length);
        return parsedNotifications;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des notifications depuis le stockage:', error);
      return [];
    }
  };

  // Mettre en place les gestionnaires de notifications
  useEffect(() => {
    console.log('NotificationContext - Setting up handlers, isConfigured:', isNotificationsConfigured);
    if (isNotificationsConfigured) {
      const cleanupHandlers = setupNotificationHandlers();
      
      // Configurer le gestionnaire pour les notifications sur lesquelles on a appuyé
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        console.log('NotificationContext - Notification response received:', data);
        setLastNotification(data);
        // Ajouter à la file d'attente pour traitement ultérieur par le composant utilisant la navigation
        setNotificationQueue(prev => [...prev, data]);
        
        // Si la notification a un ID et vient du backend, la marquer comme lue
        if (data.notificationId) {
          markNotificationAsRead(data.notificationId);
        }
      });
      
      return () => {
        cleanupHandlers();
        responseSubscription.remove();
      };
    }
  }, [isNotificationsConfigured, markNotificationAsRead]);

  // Fonction pour traiter une notification avec navigation
  const processNotification = (navigation, notification, isAuthenticated, userRole) => {
    console.log('NotificationContext - Processing notification:', notification, 'userRole:', userRole);
    if (!notification) return;
    
    // Si la notification a un ID et vient du backend, la marquer comme lue
    if (notification.notificationId) {
      markNotificationAsRead(notification.notificationId);
    }
    
    // Navigation en fonction du type de notification
    if (notification.type === 'new_appointment' || notification.type === 'confirmed_appointment') {
      if (notification.appointmentId) {
        if (isAuthenticated && userRole === 'Doctor') {
          navigation.navigate('DoctorHome', {
            screen: 'Calendar',
            params: { appointmentId: notification.appointmentId }
          });
        } else if (isAuthenticated && userRole === 'Patient') {
          navigation.navigate('PatientHome', {
            screen: 'Appointments',
            params: { appointmentId: notification.appointmentId }
          });
        }
      }
    } 
    // Gérer les demandes de reprogrammation
    else if (notification.type === 'reschedule_requested') {
      console.log('NotificationContext - Processing reschedule request:', notification.appointmentId);
      if (notification.appointmentId && notification.doctorId) {
        if (isAuthenticated && userRole === 'Patient') {
          // Rediriger le patient vers l'écran de reprogrammation
          navigation.push('/patient/appointment/new', { 
            doctorId: notification.doctorId,
            appointmentIdToReschedule: notification.appointmentId
          });
        }
      }
    }
    // Ajouter ici d'autres types de notifications au besoin
  };

  // Fonction pour traiter toutes les notifications en attente
  const processNotificationQueue = (navigation, isAuthenticated, userRole) => {
    console.log('NotificationContext - Processing notification queue, length:', notificationQueue.length);
    if (notificationQueue.length > 0) {
      const currentNotification = notificationQueue[0];
      processNotification(navigation, currentNotification, isAuthenticated, userRole);
      // Retirer la notification traitée de la file d'attente
      setNotificationQueue(prev => prev.slice(1));
    }
  };

  // Fonction pour envoyer une notification locale (test)
  const sendTestNotification = async (title, body, data = {}) => {
    console.log('NotificationContext - Sending test notification:', title, body, data);
    try {
      await sendLocalNotification(title, body, data);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      return false;
    }
  };

  // Initialisation - charger les notifications depuis le stockage local au démarrage
  useEffect(() => {
    const loadInitialNotifications = async () => {
      const cachedNotifications = await loadNotificationsFromStorage();
      if (cachedNotifications && cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
      }
    };
    
    loadInitialNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        isNotificationsConfigured,
        lastNotification,
        notificationQueue,
        notifications,
        unreadCount,
        isLoading,
        error,
        setupNotificationsIfNeeded,
        processNotification,
        processNotificationQueue,
        sendTestNotification,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;