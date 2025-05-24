import { Stack } from 'expo-router';
import React from 'react';

export default function PatientScreensLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      // Masquer le chemin de navigation
      title: ''
    }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="appointment" options={{ headerShown: false }} />
      <Stack.Screen name="doctor" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="assessment" options={{ headerShown: false }} />
    </Stack>
  );
} 