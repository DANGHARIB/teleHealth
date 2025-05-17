import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, PRIMARY_COLOR } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Couleur active pour les icônes
const ACTIVE_ICON_COLOR = '#090F47';

export default function PatientTabLayout() { // Renommé pour clarté
  const colorScheme = useColorScheme();

  return (
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
      }}>
      <Tabs.Screen
        name="index" // Correspondra à (patient)/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <IconSymbol size={28} name="house.fill" color={focused ? ACTIVE_ICON_COLOR : color} />,
        }}
      />
      <Tabs.Screen
        name="search" // Correspondra à (patient)/(tabs)/search.tsx
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="search" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment" // Correspondra à (patient)/(tabs)/appointment.tsx
        options={{
          title: 'Appointment',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="calendar" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments" // Correspondra à (patient)/(tabs)/payments.tsx
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="credit-card" size={22} color={focused ? ACTIVE_ICON_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Correspondra à (patient)/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user" size={24} color={focused ? ACTIVE_ICON_COLOR : color} />
          ),
        }}
      />
    </Tabs>
  );
} 