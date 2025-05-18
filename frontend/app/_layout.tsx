import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import notificationService from '../services/notificationService';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNavigation() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Charger ici d'autres polices si nécessaire (ex: FontAwesome si pas déjà géré globalement)
  });
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);

  // Configurer les notifications
  useEffect(() => {
    if (loaded) {
      // Configurer les permissions de notification
      notificationService.configureNotifications();
      
      // Mettre en place les gestionnaires de notification
      const cleanupNotifications = notificationService.setupNotificationHandlers();
      
      // Nettoyer les gestionnaires à la déconnexion
      return cleanupNotifications;
    }
  }, [loaded]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userInfoString = await AsyncStorage.getItem('userInfo');
        
        // Récupérer le premier segment s'il existe
        const firstSegment = segments.length > 0 ? segments[0] : '';
        
        // Vérifier si on est sur une page initiale
        const isOnIntroPages = firstSegment === 'index' || 
                               firstSegment === 'welcome' || 
                               segments.length === 0;

        if (isOnIntroPages) {
          setInitialRoute(undefined); // Pas de redirection automatique si sur les pages initiales
        } else if (userToken && userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          const userRole = userInfo.role;
          if (userRole === 'Patient') {
            setInitialRoute('/(patient)');
          } else if (userRole === 'Doctor') {
            setInitialRoute('/(doctor)');
          } else {
            setInitialRoute('/'); // Rôle inconnu, fallback
          }
        } else {
          // Pas de token ou d'infos user, et pas sur les pages initiales -> rediriger vers l'accueil général
          setInitialRoute('/'); 
        }
      } catch (e) {
        console.error("Failed to check auth state:", e);
        setInitialRoute('/'); // En cas d'erreur, rediriger vers l'accueil
      } finally {
        setAuthChecked(true);
      }
    };

    if (loaded) {
        checkAuth();
    }
  }, [loaded, segments]);

 useEffect(() => {
    if (!authChecked || !loaded || !initialRoute) {
      return;
    }

    // Récupérer le premier segment s'il existe
    const firstSegment = segments.length > 0 ? segments[0] : '';
    
    // Vérifier si on a un second segment
    const secondSegment = segments.length > 1 ? segments[1] : '';
    const isAuthFlow = secondSegment === 'auth';

    // Vérifier si on est sur une page initiale
    const isOnIntroPages = firstSegment === 'index' || 
                           firstSegment === 'welcome' || 
                           segments.length === 0;
    
    // Vérifier si on est dans les sections patient ou docteur
    const inPatientTabs = firstSegment === '(patient)' && !isAuthFlow;
    const inDoctorTabs = firstSegment === '(doctor)' && !isAuthFlow;
    
    // Vérifier si on est dans une page d'authentification
    const inDoctorAuth = firstSegment === 'doctor' && secondSegment === 'auth';
    const inPatientAuth = firstSegment === 'patient' && secondSegment === 'auth';

    // Si vous êtes dans une page d'authentification, ne redirigez pas
    if (inDoctorAuth || inPatientAuth || isAuthFlow) {
      return;
    }

    // Ces redirections seront réactivées une fois le problème résolu
    /*
    if (initialRoute === '/(patient)' && !inPatientTabs && !isOnIntroPages) {
      router.replace('/(patient)/(tabs)');
    } else if (initialRoute === '/(doctor)' && !inDoctorTabs && !isOnIntroPages) {
      router.replace('/(doctor)/(tabs)');
    } else if (initialRoute === '/' && (inPatientTabs || inDoctorTabs)) {
      router.replace('/');
    }
    */

  }, [authChecked, initialRoute, segments, router, loaded]);


  if (!loaded) { // On ne vérifie plus authChecked ici, car il est utilisé pour la logique de redirection
    return null; 
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Les groupes (patient) et (doctor) auront leurs propres Stack.Screen pour les onglets */}
        {/* On définit ici les écrans accessibles globalement ou avant la redirection */}
        <Stack.Screen name="index" options={{ headerShown: false }} /> 
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(patient)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
        {/* Ajouter ici les écrans d'authentification s'ils ne sont pas dans des groupes spécifiques */}
        {/* exemple: <Stack.Screen name="(auth)/login" options={{ headerShown: false }} /> */}
        {/* Ou s'assurer que les dossiers (patient)/auth et (doctor)/auth sont bien gérés par leurs layouts respectifs s'ils en ont un */} 
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RootLayoutNavigation />
      </NotificationProvider>
    </AuthProvider>
  );
}
