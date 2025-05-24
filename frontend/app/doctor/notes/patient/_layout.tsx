import { Stack } from 'expo-router';
import React from 'react';

export default function PatientNotesLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      // Masquer le chemin de navigation
      title: ''
    }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
} 