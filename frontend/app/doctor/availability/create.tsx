import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

type TimeSlot = {
  startTime: string;
  endTime: string;
};

export default function CreateAvailabilityScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([
    { startTime: '09:00', endTime: '10:00' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gérer le changement de date
  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Ajouter un nouveau créneau
  const addSlot = () => {
    // Prendre l'heure de fin du dernier créneau comme début du nouveau
    const lastSlot = slots[slots.length - 1];
    const lastEndHour = parseInt(lastSlot.endTime.split(':')[0]);
    const lastEndMinute = parseInt(lastSlot.endTime.split(':')[1]);
    
    // Calculer le nouveau créneau (1 heure après le dernier)
    let newStartHour = lastEndHour;
    let newStartMinute = lastEndMinute;
    let newEndHour = newStartHour + 1;
    let newEndMinute = newStartMinute;
    
    // Gérer le passage à minuit
    if (newEndHour >= 24) {
      newEndHour = 23;
      newEndMinute = 59;
    }
    
    const newStartTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`;
    const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`;
    
    setSlots([...slots, { startTime: newStartTime, endTime: newEndTime }]);
  };
  
  // Supprimer un créneau
  const removeSlot = (index: number) => {
    if (slots.length === 1) {
      Alert.alert('Attention', 'Vous devez conserver au moins un créneau');
      return;
    }
    
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };
  
  // Mettre à jour l'heure de début d'un créneau
  const updateStartTime = (index: number, value: string) => {
    const newSlots = [...slots];
    newSlots[index].startTime = value;
    setSlots(newSlots);
  };
  
  // Mettre à jour l'heure de fin d'un créneau
  const updateEndTime = (index: number, value: string) => {
    const newSlots = [...slots];
    newSlots[index].endTime = value;
    setSlots(newSlots);
  };
  
  // Sauvegarder les disponibilités
  const saveAvailabilities = async () => {
    // Vérifier que les créneaux sont valides
    const invalidSlots = slots.filter(slot => {
      const startParts = slot.startTime.split(':');
      const endParts = slot.endTime.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      return startMinutes >= endMinutes;
    });
    
    if (invalidSlots.length > 0) {
      Alert.alert('Erreur', 'L\'heure de début doit être antérieure à l\'heure de fin pour chaque créneau.');
      return;
    }
    
    // Vérifier que les créneaux ne se chevauchent pas
    for (let i = 0; i < slots.length - 1; i++) {
      const slot1EndParts = slots[i].endTime.split(':');
      const slot2StartParts = slots[i + 1].startTime.split(':');
      const slot1EndMinutes = parseInt(slot1EndParts[0]) * 60 + parseInt(slot1EndParts[1]);
      const slot2StartMinutes = parseInt(slot2StartParts[0]) * 60 + parseInt(slot2StartParts[1]);
      
      if (slot1EndMinutes > slot2StartMinutes) {
        Alert.alert('Erreur', 'Les créneaux ne doivent pas se chevaucher.');
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Formater la date pour l'API
      const dateToSend = format(date, 'yyyy-MM-dd');
      
      // Préparer les disponibilités à envoyer
      const availabilitiesToSend = slots.map(slot => ({
        date: dateToSend,
        startTime: slot.startTime,
        endTime: slot.endTime
      }));
      
      // Appel API pour créer les disponibilités
      await doctorAPI.createBatchAvailability(availabilitiesToSend);
      
      Alert.alert(
        'Succès',
        'Vos disponibilités ont été enregistrées avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la création des disponibilités:', error);
      Alert.alert('Erreur', 'Impossible de créer les disponibilités. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Ajouter des disponibilités',
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
      
      <ScrollView style={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sélectionner une date</ThemedText>
          
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color="#4a90e2" style={styles.dateIcon} />
            <ThemedText style={styles.dateText}>
              {format(date, 'EEEE dd MMMM yyyy', { locale: fr })}
            </ThemedText>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Créneaux horaires</ThemedText>
            <TouchableOpacity style={styles.addSlotButton} onPress={addSlot}>
              <Ionicons name="add-circle" size={24} color="#4a90e2" />
            </TouchableOpacity>
          </View>
          
          {slots.map((slot, index) => (
            <ThemedView key={index} style={styles.slotContainer}>
              <View style={styles.timePickerContainer}>
                <View style={styles.timePicker}>
                  <ThemedText style={styles.timeLabel}>Début</ThemedText>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => {
                      // Ici, on utiliserait normalement un time picker, mais pour simplifier, 
                      // on utilise une valeur fixe pour l'exemple
                      updateStartTime(index, slot.startTime);
                    }}
                  >
                    <ThemedText style={styles.timeText}>{slot.startTime}</ThemedText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timePicker}>
                  <ThemedText style={styles.timeLabel}>Fin</ThemedText>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => {
                      // Ici, on utiliserait normalement un time picker, mais pour simplifier,
                      // on utilise une valeur fixe pour l'exemple
                      updateEndTime(index, slot.endTime);
                    }}
                  >
                    <ThemedText style={styles.timeText}>{slot.endTime}</ThemedText>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.removeSlotButton}
                  onPress={() => removeSlot(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#e53935" />
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))}
        </ThemedView>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveAvailabilities}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={24} color="#fff" style={styles.saveIcon} />
              <ThemedText style={styles.saveButtonText}>Enregistrer</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14104B',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  addSlotButton: {
    padding: 4,
  },
  slotContainer: {
    marginBottom: 12,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePicker: {
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  removeSlotButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 