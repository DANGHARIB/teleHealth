import { Stack } from 'expo-router';
import React from 'react';

export default function NotesLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      // Masquer le chemin de navigation
      title: ''
    }}>
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="patient" options={{ headerShown: false }} />
    </Stack>
  );
} 