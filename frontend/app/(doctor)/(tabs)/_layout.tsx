import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, PRIMARY_COLOR, DARK_BLUE_THEME, LIGHT_BLUE_ACCENT } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DoctorTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DARK_BLUE_THEME,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index" // Will be (doctor)/(tabs)/index.tsx (Financials)
        options={{
          title: 'Financials',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="credit-card" size={22} color={focused ? DARK_BLUE_THEME : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search" // Will be (doctor)/(tabs)/search.tsx
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="search" size={24} color={focused ? DARK_BLUE_THEME : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment" // Will be (doctor)/(tabs)/appointment.tsx
        options={{
          title: 'Appointment',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="calendar" size={24} color={focused ? DARK_BLUE_THEME : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Will be (doctor)/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user-md" size={24} color={focused ? DARK_BLUE_THEME : color} />
          ),
        }}
      />
    </Tabs>
  );
} 