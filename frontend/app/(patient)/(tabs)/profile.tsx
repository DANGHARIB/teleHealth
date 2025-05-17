import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar,
  ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

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

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        console.log("ProfileScreen focused, fetching user info...");
        try {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            
            let displayName = 'Patient';
            if (userInfo.fullName) {
              displayName = userInfo.fullName.trim();
            } else {
              const firstName = userInfo.profile?.first_name || '';
              const lastName = userInfo.profile?.last_name || '';
              if (firstName && lastName) {
                displayName = `${firstName.trim()} ${lastName.trim()}`;
              } else if (firstName) {
                displayName = firstName.trim();
              } else if (lastName) {
                displayName = lastName.trim();
              }
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      console.log("User token and info removed, logging out.");
      router.replace('/patient/auth/login');
    } catch (error) {
      console.error("Failed to logout", error);
      router.replace('/patient/auth/login');
    }
  };

  const goToEditProfile = () => {
    console.log("Navigate to Edit Profile");
    router.push('/patient/profile/edit');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
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
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
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
}); 