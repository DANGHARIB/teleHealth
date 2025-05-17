import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Optional: for an icon

const AccountUnderReviewScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/doctor/auth/welcome'); // Correction du chemin
    }, 5000); // 5 seconds delay

    return () => clearTimeout(timer); // Cleanup the timer
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Optional: Icon can be added here */}
        {/* <Ionicons name="hourglass-outline" size={64} color="#0A1E42" style={styles.icon} /> */}
        <Text style={styles.title}>Your account is currently under review.</Text>
        <Text style={styles.message}>
          You will receive an email with a confirmation once the review is complete or, if needed, an email requesting additional information or notifying you of any issues.
        </Text>
        <Text style={styles.thankYouMessage}>Thank you for your patience!</Text>
        <ActivityIndicator size="large" color="#0A1E42" style={styles.spinner} />
      </View>
    </SafeAreaView>
  );
};

// ... existing code ...
// Les styles restent les mêmes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 30,
    alignItems: 'center',
    maxWidth: 500, // For better readability on larger screens
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1E42',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  thankYouMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  }
});

export default AccountUnderReviewScreen; 