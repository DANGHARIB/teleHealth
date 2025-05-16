import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AppointmentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      <Text>Appointment booking and management will be here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}); 