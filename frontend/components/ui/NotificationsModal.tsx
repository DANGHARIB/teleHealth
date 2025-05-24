import React, { useState, useContext, useEffect } from 'react';
import { 
  Modal, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert,
  Pressable,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Text } from './Text';
import { NotificationContext } from '../../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = '@notifications';
const { width, height } = Dimensions.get('window');

interface NotificationData {
  type?: string;
  title?: string;
  body?: string;
  message?: string;
  notificationId?: string;
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  [key: string]: any;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: NotificationData;
}

interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

/**
 * Notification card component
 */
const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const { colors } = useTheme();
  const { type, title, message, createdAt, read } = notification;
  
  // Icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'new_appointment':
      case 'confirmed_appointment':
      case 'rescheduled':
      case 'reschedule_requested':
      case 'appointment_reminder':
        return 'calendar';
      case 'payment_received':
      case 'payment_refunded':
        return 'credit-card';
      case 'cancelled_appointment':
        return 'times-circle';
      default:
        return 'bell';
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: read ? colors.card : colors.background,
          borderLeftColor: read ? 'transparent' : colors.primary
        }
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <FontAwesome 
          name={getIcon()} 
          size={20} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !read && styles.unread]}>{title || 'Notification'}</Text>
        {/* FIXED: Removed numberOfLines to show full message */}
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.date}>{new Date(createdAt).toLocaleString()}</Text>
      </View>
      {!read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
};

/**
 * Notifications modal component
 */
export const NotificationsModal = ({ visible, onClose, navigation }: NotificationsModalProps) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { 
    notifications, 
    fetchNotifications, 
    isLoading, 
    error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    processNotification
  } = useContext(NotificationContext);
  
  // Load notifications when modal becomes visible
  useEffect(() => {
    if (visible) {
      console.log('NotificationsModal - Modal visible, loading notifications...');
      loadNotifications();
    }
  }, [visible]);

  // Log notifications when they change
  useEffect(() => {
    console.log('NotificationsModal - Notifications updated:', 
      notifications ? `${notifications.length} items` : 'none');
    
    if (notifications && notifications.length > 0) {
      console.log('NotificationsModal - First notification:', notifications[0]._id);
    }
  }, [notifications]);
  
  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      console.log('NotificationsModal - Loading notifications from API...');
      await fetchNotifications(1, 20);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Unable to load notifications');
    }
  };
  
  // Load more notifications (pagination)
  const loadMoreNotifications = async () => {
    try {
      const nextPage = currentPage + 1;
      console.log(`NotificationsModal - Loading more notifications, page ${nextPage}...`);
      const response = await fetchNotifications(nextPage, 20);
      
      // If we received data, increment the page counter
      if (response.data && response.data.length > 0) {
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
    }
  };
  
  // IMPROVED: Simplified and more robust notification handling
  const handleNotificationPress = async (notification: Notification) => {
    console.log('NotificationsModal - Notification pressed:', {
      id: notification._id,
      type: notification.type,
      data: notification.data
    });
    
    try {
      // Step 1: Mark as read
      console.log('NotificationsModal - Marking notification as read...');
      await markNotificationAsRead(notification._id);
      
      // Step 2: Close modal
      console.log('NotificationsModal - Closing modal...');
      onClose();
      
      // Step 3: Handle navigation
      if (!navigation) {
        console.error('NotificationsModal - Navigation object is missing');
        Alert.alert('Error', 'Navigation not available');
        return;
      }

      if (!processNotification) {
        console.error('NotificationsModal - processNotification function is missing');
        Alert.alert('Error', 'Notification processing not available');
        return;
      }

      // Step 4: Get user info for navigation context
      console.log('NotificationsModal - Getting user info...');
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (!userInfoString) {
        console.error('NotificationsModal - No user info found in storage');
        Alert.alert('Error', 'User authentication required');
        return;
      }

      const userInfo = JSON.parse(userInfoString);
      const isAuthenticated = !!userInfo;
      const userRole = userInfo?.role || '';
      
      console.log('NotificationsModal - User context:', {
        isAuthenticated,
        userRole,
        hasUserInfo: !!userInfo
      });
      
      // Step 5: Prepare notification data with proper string values
      // Ensure all fields are properly typed strings to avoid serialization issues
      const notificationData = {
        type: notification.type || '',
        notificationId: notification._id || '',
        title: notification.title || '',
        message: notification.message || '',
        appointmentId: notification.data?.appointmentId || '',
        doctorId: notification.data?.doctorId || '',
      };

      console.log('NotificationsModal - Final notification data (stringified):', notificationData);
      
      // Step 6: Process notification
      console.log('NotificationsModal - Processing notification for navigation...');
      processNotification(navigation, notificationData, isAuthenticated, userRole);
      
    } catch (error) {
      console.error('NotificationsModal - Error processing notification:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to navigate to the requested page. Please try again.'
      );
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Mark as Read",
      "Mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark All", 
          onPress: async () => {
            try {
              await markAllNotificationsAsRead();
            } catch (error) {
              console.error('Error marking all notifications as read:', error);
              Alert.alert('Error', 'Unable to mark notifications as read');
            }
          }
        }
      ]
    );
  };
  
  // Clear all notifications
  const handleClearAll = () => {
    Alert.alert(
      "Clear Notifications",
      "Do you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllNotifications();
            } catch (error) {
              console.error('Error clearing all notifications:', error);
              Alert.alert('Error', 'Unable to clear notifications');
            }
          }
        }
      ]
    );
  };
  
  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };
  
  // Handle scroll to bottom (load more notifications)
  const handleScrollEnd = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
    const paddingToBottom = 20; // Threshold to trigger loading more
    if (
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom
    ) {
      // Load more data when user scrolls to the bottom
      if (!isLoading && notifications.length >= currentPage * 20) {
        loadMoreNotifications();
      }
    }
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={[
            styles.modalContent, 
            { backgroundColor: colors.card }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Notifications</Text>
            
            <View style={styles.modalActions}>
              {notifications.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleMarkAllAsRead}
                  >
                    <Text style={[styles.actionText, { color: colors.primary }]}>Mark All</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleClearAll}
                  >
                    <Text style={[styles.actionText, { color: colors.primary }]}>Clear</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: `${colors.primary}15` }]}
                onPress={onClose}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoading && notifications.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.text, marginTop: 16 }]}>
                Loading notifications...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="bell-o" size={50} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No notifications yet
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.notificationsList}
              contentContainerStyle={styles.notificationsContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onScroll={({ nativeEvent }) => handleScrollEnd(nativeEvent)}
              scrollEventThrottle={400}
            >
              {notifications.map((notification: Notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onPress={handleNotificationPress}
                />
              ))}
              
              {isLoading && notifications.length > 0 && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.text, marginLeft: 8 }}>
                    Loading...
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.notification }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={loadNotifications}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom close button */}
          <TouchableOpacity
            style={[styles.bottomCloseButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.bottomCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.7,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    flex: 1,
    maxHeight: height * 0.55,
  },
  notificationsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 6,
    // IMPROVED: Allow flexible height for full message display
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
  },
  unread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 18,
    right: 16,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomCloseButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsModal;