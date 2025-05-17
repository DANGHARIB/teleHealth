import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, PRIMARY_COLOR } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function PatientTabLayout() { // Renommé pour clarté
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
          tabBarIcon: ({ color, focused }) => <IconSymbol size={28} name="house.fill" color={focused ? PRIMARY_COLOR : color} />,
        }}
      />
      <Tabs.Screen
        name="search" // Correspondra à (patient)/(tabs)/search.tsx
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => <IconSymbol size={28} name="magnifyingglass" color={focused ? PRIMARY_COLOR : color} />,
        }}
      />
      <Tabs.Screen
        name="appointment" // Correspondra à (patient)/(tabs)/appointment.tsx
        options={{
          title: 'Appointment',
          tabBarIcon: ({ color, focused }) => <IconSymbol size={28} name="calendar" color={focused ? PRIMARY_COLOR : color} />,
        }}
      />
      <Tabs.Screen
        name="profile" // Correspondra à (patient)/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <IconSymbol size={28} name="person.fill" color={focused ? PRIMARY_COLOR : color} />,
        }}
      />
    </Tabs>
  );
} 