import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, PRIMARY_COLOR } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DoctorTabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY_COLOR,
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
        name="index" // Sera (doctor)/(tabs)/index.tsx (Financials)
        options={{
          title: 'Financials',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="dollar" size={24} color={focused ? PRIMARY_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search" // Sera (doctor)/(tabs)/search.tsx
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="search" size={24} color={focused ? PRIMARY_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointment" // Sera (doctor)/(tabs)/appointment.tsx
        options={{
          title: 'Appointment',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="calendar" size={24} color={focused ? PRIMARY_COLOR : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Sera (doctor)/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user-md" size={24} color={focused ? PRIMARY_COLOR : color} />
          ),
        }}
      />
    </Tabs>
  );
} 