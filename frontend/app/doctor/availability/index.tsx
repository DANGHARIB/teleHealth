import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import fr from 'date-fns/locale/fr';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

type Availability = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export default function AvailabilityScreen() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fonction pour charger les disponibilités
  const fetchAvailabilities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doctorAPI.getMyAvailability();
      
      // Trier les disponibilités par date et heure
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime() || 
               a.startTime.localeCompare(b.startTime);
      });
      
      setAvailabilities(sortedData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des disponibilités:', err);
      setError('Impossible de charger vos disponibilités');
      setLoading(false);
    }
  }, []);
  
  // Charger les disponibilités au chargement initial et à chaque retour sur la page
  useFocusEffect(
    useCallback(() => {
      fetchAvailabilities();
      return () => {
        // Nettoyage optionnel
      };
    }, [fetchAvailabilities])
  );
  
  // Supprimer une disponibilité
  const handleDeleteAvailability = async (id: string) => {
    try {
      // Trouver la disponibilité pour l'afficher dans l'alerte
      const availability = availabilities.find(a => a._id === id);
      if (!availability) return;
      
      const formattedDate = format(parseISO(availability.date), 'dd MMMM yyyy', { locale: fr });
      
      Alert.alert(
        'Confirmation',
        `Voulez-vous supprimer cette disponibilité du ${formattedDate} de ${availability.startTime} à ${availability.endTime} ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await doctorAPI.deleteAvailability(id);
              
              // Mettre à jour la liste
              fetchAvailabilities();
              
              Alert.alert('Succès', 'Disponibilité supprimée avec succès');
            }
          }
        ]
      );
    } catch (err) {
      console.error('Erreur lors de la suppression de la disponibilité:', err);
      Alert.alert('Erreur', 'Impossible de supprimer cette disponibilité');
      setLoading(false);
    }
  };
  
  // Grouper les disponibilités par jour pour l'affichage
  const groupedAvailabilities = availabilities.reduce((groups, availability) => {
    const date = format(parseISO(availability.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(availability);
    return groups;
  }, {} as Record<string, Availability[]>);
  
  // Convertir les dates groupées en tableau pour l'affichage
  const dateGroups = Object.keys(groupedAvailabilities).sort();
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Mes Disponibilités',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
            color: '#14104B'
          },
        }} 
      />
      
      <ThemedView style={styles.container}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/doctor/availability/create')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" style={styles.addIcon} />
          <ThemedText style={styles.addButtonText}>Ajouter des disponibilités</ThemedText>
        </TouchableOpacity>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : availabilities.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Aucune disponibilité définie</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Cliquez sur le bouton ci-dessus pour ajouter vos premières disponibilités
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedText style={styles.sectionTitle}>Vos créneaux disponibles</ThemedText>
            
            {dateGroups.map(dateString => (
              <View key={dateString} style={styles.dateGroup}>
                <ThemedText style={styles.dateHeader}>
                  {format(parseISO(dateString), 'EEEE dd MMMM yyyy', { locale: fr })}
                </ThemedText>
                
                {groupedAvailabilities[dateString].map(availability => (
                  <ThemedView key={availability._id} style={[
                    styles.slotCard,
                    availability.isBooked && styles.bookedSlot
                  ]}>
                    <View style={styles.slotInfo}>
                      <ThemedText style={styles.timeText}>
                        {availability.startTime} - {availability.endTime}
                      </ThemedText>
                      {availability.isBooked && (
                        <ThemedView style={styles.bookedBadge}>
                          <ThemedText style={styles.bookedText}>Réservé</ThemedText>
                        </ThemedView>
                      )}
                    </View>
                    
                    {!availability.isBooked && (
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAvailability(availability._id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#e53935" />
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                ))}
              </View>
            ))}
          </>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    marginTop: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#14104B',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    paddingLeft: 8,
    textTransform: 'capitalize',
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bookedSlot: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  slotInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bookedBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  bookedText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
}); 