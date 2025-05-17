import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Charger ici d'autres polices si nécessaire (ex: FontAwesome si pas déjà géré globalement)
  });
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined);

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
        
        const currentTopSegment = segments.length > 0 ? segments[0] : null;
        const isIndexPage: boolean = currentTopSegment === 'index';
        const isWelcomePage: boolean = currentTopSegment === 'welcome';
        const isEmptySegments: boolean = segments.length === 0;

        if (isIndexPage || isWelcomePage || isEmptySegments) {
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
    if (!authChecked || !loaded) {
      return;
    }
    if (!initialRoute) return;

    const currentTopSegmentForRedirect = segments.length > 0 ? segments[0] : null;
    const isAuthFlow = (segments.length > 1 && segments[1] === 'auth');

    const isRedirectIndexPage = currentTopSegmentForRedirect === 'index';
    const isRedirectWelcomePage = currentTopSegmentForRedirect === 'welcome';
    const isEmptySegments = segments.length === 0;
    const isActuallyOnInitialOrPublicPath = isRedirectIndexPage || isRedirectWelcomePage || isEmptySegments;
    
    const inPatientTabs = currentTopSegmentForRedirect === '(patient)' && !isAuthFlow;
    const inDoctorTabs = currentTopSegmentForRedirect === '(doctor)' && !isAuthFlow;
    const inDoctorAuth = segments.length > 1 && segments[0] === 'doctor' && segments[1] === 'auth';
    const inPatientAuth = segments.length > 1 && segments[0] === 'patient' && segments[1] === 'auth';

    // Désactivons temporairement les redirections automatiques pour débugger le flux
    // Si vous êtes dans une page d'authentification, ne redirigez pas
    if (inDoctorAuth || inPatientAuth) {
      return;
    }

    if (isAuthFlow) {
      return;
    }

    // Ces redirections seront réactivées une fois le problème résolu
    /*
    if (initialRoute === '/(patient)' && !inPatientTabs && !isActuallyOnInitialOrPublicPath) {
      router.replace('/(patient)/(tabs)');
    } else if (initialRoute === '/(doctor)' && !inDoctorTabs && !isActuallyOnInitialOrPublicPath) {
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
