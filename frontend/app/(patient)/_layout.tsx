import { Stack } from 'expo-router';
import React from 'react';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          // Masquer complètement le chemin de navigation
          title: '' 
        }} 
      />
    </Stack>
  );
} 