import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { NotificationHandler } from '@/components/ui/NotificationHandler';
import { Colors, PRIMARY_COLOR, DARK_BLUE_THEME, LIGHT_BLUE_ACCENT } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Active color for icons
const ACTIVE_ICON_COLOR = '#090F47';

export default function DoctorTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      {/* Notification handler for doctor section */}
      <NotificationHandler />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: ACTIVE_ICON_COLOR,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Payments',
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome name="credit-card" size={22} color={focused ? ACTIVE_ICON_COLOR : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome name="search" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointment"
          options={{
            title: 'Appointment',
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome name="calendar" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome name="user" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
} 