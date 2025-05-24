import React, { useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NotificationContext } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Component that handles notifications and manages navigation
 * This component should be placed at a level where useNavigation is available
 */
export const NotificationHandler = () => {
  const navigation = useNavigation();
  const { 
    notificationQueue, 
    processNotificationQueue, 
    setupNotificationsIfNeeded 
  } = useContext(NotificationContext);
  
  // Configure notifications and process the queue
  useEffect(() => {
    const setupAndProcess = async () => {
      try {
        // Check if user is authenticated
        const userInfoString = await AsyncStorage.getItem('@user');
        if (!userInfoString) return;
        
        const userInfo = JSON.parse(userInfoString);
        const isAuthenticated = !!userInfo;
        const userRole = userInfo?.role || '';
        
        // Configure notifications if needed
        await setupNotificationsIfNeeded(isAuthenticated);
        
        // Process notifications in queue
        if (notificationQueue.length > 0) {
          processNotificationQueue(navigation, isAuthenticated, userRole);
        }
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    };
    
    setupAndProcess();
  }, [notificationQueue, navigation, processNotificationQueue, setupNotificationsIfNeeded]);
  
  // This component doesn't render anything, it's just a handler
  return null;
};

export default NotificationHandler;