import React, { useState, useCallback, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { NotificationContext } from '../../../contexts/NotificationContext';
import { NotificationIcon } from '../../../components/ui/NotificationIcon';
import { NotificationsModal } from '../../../components/ui/NotificationsModal';

const COLORS = {
  primary: '#7AA7CC',
  primaryLight: '#8FB5D5',
  primaryDark: '#6999BE',
  secondary: '#F8FAFC',
  accent: '#7AA7CC',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  purple: '#8B5CF6',
  darkBlue: '#090F47',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#090F47',
  white: '#FFFFFF',
  background: '#FAFBFE',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Patient');
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>(undefined);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { notificationQueue, sendTestNotification, notifications, fetchNotifications, unreadCount, fetchUnreadCount } = useContext(NotificationContext);

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        console.log("ProfileScreen focused, fetching user info...");
        try {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            
            let displayName = 'Patient';
            // Always prioritize first_name and last_name from profile
            const firstName = userInfo.profile?.first_name || '';
            const lastName = userInfo.profile?.last_name || '';
            if (firstName && lastName) {
              displayName = `${firstName.trim()} ${lastName.trim()}`;
            } else if (firstName) {
              displayName = firstName.trim();
            } else if (lastName) {
              displayName = lastName.trim();
            } else if (userInfo.fullName) {
              // Fall back to fullName only if no first/last name available
              displayName = userInfo.fullName.trim();
            }
            setUserName(displayName);

            // We could add profile image handling here similar to doctor profile
          }
        } catch (error) {
          console.error("Failed to fetch user info from storage", error);
          setUserName('Patient');
        }
      };

      fetchUserInfo();

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Charger les notifications au démarrage
  useEffect(() => {
    console.log('ProfileScreen - Loading initial notifications');
    fetchNotifications(1, 20);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Actualiser les notifications lorsque le modal est ouvert
  useEffect(() => {
    if (notificationModalVisible) {
      console.log('ProfileScreen - Modal opened, refreshing notifications');
      fetchNotifications(1, 20);
      fetchUnreadCount();
    }
  }, [notificationModalVisible, fetchNotifications, fetchUnreadCount]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              console.log("User token and info removed, logging out.");
              router.replace('/welcome');
            } catch (error) {
              console.error("Failed to logout", error);
              router.replace('/welcome');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const goToEditProfile = () => {
    console.log("Navigate to Edit Profile");
    router.push('/patient/profile/edit');
  };

  const goToPaymentMethods = () => {
    console.log("Navigate to Payment Methods");
    router.push('/patient/profile/payment-methods');
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      description: 'Update your personal information',
      icon: 'person-outline',
      iconBackground: COLORS.primary,
      onPress: goToEditProfile,
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Manage your saved payment methods',
      icon: 'card-outline',
      iconBackground: COLORS.purple,
      onPress: goToPaymentMethods,
    },
  ];

  const renderProfileHeader = () => (
    <View style={styles.profileContainer}>
      <View style={styles.profileRow}>
        <View style={styles.profileImageContainer}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.white} />
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {userName}
          </Text>
          <Text style={styles.welcomeText}>Welcome to Tabeebou.com</Text>
        </View>
      </View>
    </View>
  );

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.menuIconContainer, { backgroundColor: `${item.iconBackground}15` }]}>
          <Ionicons 
            name={item.icon as any} 
            size={24} 
            color={item.iconBackground} 
          />
        </View>
        
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
        </View>
        
        <View style={styles.menuArrowContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={COLORS.gray400} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Function to send a test notification
  const handleSendTestNotification = async () => {
    console.log('Sending test notification...');
    try {
      await sendTestNotification(
        'Test Notification',
        'This is a test notification to verify the notification system is working.',
        {
          type: 'test_notification',
          message: 'Test notification message',
          appointmentId: 'test-id-123'
        }
      );
      console.log('Test notification sent successfully');
      Alert.alert('Success', 'Test notification sent. Check your notifications.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  // Ouvrir le modal de notifications 
  const handleOpenNotificationsModal = () => {
    console.log('ProfileScreen - Opening notifications modal, unreadCount:', unreadCount);
    setNotificationModalVisible(true);
  };

  // Fermer le modal de notifications 
  const handleCloseNotificationsModal = () => {
    console.log('ProfileScreen - Closing notifications modal');
    setNotificationModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
          </View>
          
          <NotificationIcon 
            onPress={handleOpenNotificationsModal}
            unreadCount={unreadCount}
          />
        </View>

        {renderProfileHeader()}

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.menuList}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: COLORS.warning }]} 
            onPress={handleSendTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <NotificationsModal
        visible={notificationModalVisible}
        onClose={handleCloseNotificationsModal}
        navigation={router}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray500,
  },
  profileContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 24,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 20,
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 16,
  },
  menuList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: COLORS.gray500,
    lineHeight: 18,
  },
  menuArrowContainer: {
    padding: 4,
  },
  logoutContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  notificationIcon: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 8,
    marginLeft: 10
  },
}); 