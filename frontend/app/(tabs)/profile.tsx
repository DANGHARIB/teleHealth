import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  // TODO: Ajouter la logique de déconnexion et de suppression de token/état d'authentification
  const handleLogout = () => {
    console.log("Logout action");
    // Exemple: router.replace('/login'); // ou la route de votre écran de connexion
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.text}>Hi, Lorem ipsum</Text>
      <Text style={styles.text}>Welcome to Tabeeou.com</Text>
      {/* Placeholder pour les paramètres - similaire à votre wireframe */}
      <View style={styles.settingsPlaceholder}>
        <Text>Settings {'>'}</Text>
      </View>
      <Button title="Logout" onPress={handleLogout} />
      {/* Vous ajouterez ici d'autres informations du profil et la liste des docteurs recommandés */}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  settingsPlaceholder: {
    marginVertical: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    alignItems: 'center',
  }
}); 