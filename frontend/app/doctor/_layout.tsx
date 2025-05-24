import { Stack } from 'expo-router';
import React from 'react';

export default function DoctorScreensLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      // Masquer le chemin de navigation
      title: ''
    }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="availability" options={{ headerShown: false }} />
      <Stack.Screen name="notes" options={{ headerShown: false }} />
      <Stack.Screen name="patient" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
} 