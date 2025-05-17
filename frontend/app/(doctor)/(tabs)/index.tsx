import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DoctorFinancialsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financials</Text>
      <Text>Doctor financials and earnings will be displayed here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
}); 