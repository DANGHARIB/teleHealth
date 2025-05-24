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

// Key for local notification storage
const NOTIFICATION_STORAGE_KEY = '@notifications';

export const NotificationProvider = ({ children }) => {
  const [isNotificationsConfigured, setIsNotificationsConfigured] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configure notifications
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
            'Notifications are disabled. Some features may be limited.',
            [{ text: 'OK' }]
          );
        }
        return success;
      } catch (error) {
        console.error('Error while configuring notifications:', error);
        return false;
      }
    }
    return isNotificationsConfigured;
  };

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    console.log('NotificationContext - Fetching notifications from backend, page:', page, 'limit:', limit);
    setIsLoading(true);
    setError(null);
    
    try {
      // Get notifications from API
      const response = await notificationsAPI.getNotifications(page, limit);
      console.log('NotificationContext - API Response:', response);
      
      // Check response structure and extract data correctly
      const notificationData = response.data?.data || response.data || [];
      console.log('NotificationContext - Notifications extracted:', notificationData.length);
      
      // If it's the first page, replace notifications, otherwise add to existing list
      if (page === 1) {
        setNotifications(notificationData);
      } else {
        setNotifications(prev => [...prev, ...notificationData]);
      }
      
      // Save notifications to local storage
      await saveNotificationsToStorage(notificationData);
      
      // Update unread notifications counter
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
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Unable to retrieve notifications');
      
      // On failure, use local storage as fallback
      const cachedNotifications = await loadNotificationsFromStorage();
      if (cachedNotifications && cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
      }
      
      return { data: [] };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUnreadCount]);

  // Get unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Error retrieving unread notification count:', error);
      return 0;
    }
  }, []);

  // Mark a notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Update unread notifications counter
      fetchUnreadCount();
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [fetchUnreadCount]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      
      // Update unread notifications counter
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update unread notifications counter
      fetchUnreadCount();
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [fetchUnreadCount]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationsAPI.clearAllNotifications();
      
      // Update local state
      setNotifications([]);
      
      // Update unread notifications counter
      setUnreadCount(0);
      
      // Clear notifications from local storage
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([]));
      console.log('NotificationContext - Notifications cleared from storage');
      
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  }, []);

  // Save notifications to local storage
  const saveNotificationsToStorage = async (notifs) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifs));
      console.log('NotificationContext - Notifications saved to storage:', notifs.length);
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  };

  // Load notifications from local storage
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
      console.error('Error loading notifications from storage:', error);
      return [];
    }
  };

  // Set up notification handlers
  useEffect(() => {
    console.log('NotificationContext - Setting up handlers, isConfigured:', isNotificationsConfigured);
    if (isNotificationsConfigured) {
      const cleanupHandlers = setupNotificationHandlers();
      
      // Configure handler for notifications that were tapped
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        console.log('NotificationContext - Notification response received:', data);
        setLastNotification(data);
        // Add to queue for later processing by the component using navigation
        setNotificationQueue(prev => [...prev, data]);
        
        // If notification has an ID and comes from backend, mark it as read
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

  // Function to process a notification with navigation
  const processNotification = (navigation, notification, isAuthenticated, userRole) => {
    console.log('NotificationContext - Processing notification:', notification, 'userRole:', userRole);
    if (!notification) return;
    
    // If notification has an ID and comes from backend, mark it as read
    if (notification.notificationId) {
      markNotificationAsRead(notification.notificationId);
    }
    
    // Navigation based on notification type
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
    // Handle reschedule requests
    else if (notification.type === 'reschedule_requested') {
      console.log('NotificationContext - Processing reschedule request notification');
      
      // Check if required parameters are present
      const doctorId = notification.doctorId || '';
      const appointmentId = notification.appointmentId || '';
      
      console.log('NotificationContext - Parameters:', {
        doctorId,
        appointmentId,
        hasParams: !!(doctorId && appointmentId)
      });
      
      if (doctorId && appointmentId) {
        if (isAuthenticated && userRole === 'Patient') {
          try {
            // Simplify navigation with direct URL including parameters
            const url = `/patient/appointment/new?doctorId=${doctorId}&appointmentIdToReschedule=${appointmentId}`;
            console.log('NotificationContext - Navigating to URL:', url);
            
            // Use the simplest navigation method available
            if (typeof navigation.replace === 'function') {
              navigation.replace(url);
            } else if (typeof navigation.navigate === 'function') {
              navigation.navigate(url);
            } else {
              console.error('NotificationContext - Navigation methods not available:', navigation);
            }
          } catch (err) {
            console.error('NotificationContext - Navigation error:', err);
          }
        } else {
          console.log('NotificationContext - User not authenticated as patient:', userRole);
        }
      } else {
        console.error('NotificationContext - Missing parameters for reschedule request navigation');
      }
    }
    // Add other notification types here as needed
  };

  // Function to process all pending notifications
  const processNotificationQueue = (navigation, isAuthenticated, userRole) => {
    console.log('NotificationContext - Processing notification queue, length:', notificationQueue.length);
    if (notificationQueue.length > 0) {
      const currentNotification = notificationQueue[0];
      processNotification(navigation, currentNotification, isAuthenticated, userRole);
      // Remove processed notification from queue
      setNotificationQueue(prev => prev.slice(1));
    }
  };

  // Function to send a local notification (test)
  const sendTestNotification = async (title, body, data = {}) => {
    console.log('NotificationContext - Sending test notification:', title, body, data);
    try {
      await sendLocalNotification(title, body, data);
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  // Initialization - load notifications from local storage at startup
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