import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';

// Types
type Appointment = {
  _id: string;
  patient: {
    _id: string;
    first_name?: string;
    last_name?: string;
  };
  availability: {
    date: string;
    startTime: string;
    endTime: string;
  };
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rescheduled';
  caseDetails: string;
  sessionLink?: string;
  paymentStatus: 'pending' | 'completed' | 'refunded';
};

type Availability = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export default function DoctorAppointmentScreen() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);
  
  // États pour la reprogrammation
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(false);

  // Générer les options de date (7 jours)
  useEffect(() => {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    setDateOptions(dates);
  }, []);

  // Charger les rendez-vous
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log('Tentative de récupération des rendez-vous du médecin...');
        const data = await doctorAPI.getAppointments();
        console.log('Rendez-vous récupérés avec succès:', data ? data.length : 0);
        setAppointments(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        setError('Impossible de charger vos rendez-vous');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filtrer les rendez-vous par date
  const getAppointmentsForDate = () => {
    if (!appointments.length) return [];
    
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    
    return appointments.filter(appointment => {
      const appointmentDate = appointment.availability.date;
      return appointmentDate.includes(formattedSelectedDate);
    });
  };

  // Formater l'heure
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes} ${Number(hours) >= 12 ? 'pm' : 'am'}`;
    } catch (error) {
      return time;
    }
  };

  // Obtenir le nom complet du patient
  const getPatientName = (patient: any) => {
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient';
  };

  // Mettre à jour le statut d'un rendez-vous
  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await doctorAPI.updateAppointmentStatus(appointmentId, { status: newStatus });
      
      // Mettre à jour la liste des rendez-vous
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app._id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
    }
  };
  
  // Confirmer un rendez-vous et générer un lien Zoom
  const confirmAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const updatedAppointment = await doctorAPI.confirmAppointment(appointmentId);
      
      // Mettre à jour la liste des rendez-vous
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app._id === appointmentId ? {
            ...app,
            status: 'confirmed',
            sessionLink: updatedAppointment.sessionLink
          } : app
        )
      );
      
      Alert.alert(
        "Rendez-vous confirmé",
        "Le rendez-vous a été confirmé et un lien de consultation a été créé."
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la confirmation du rendez-vous:', err);
      setLoading(false);
      Alert.alert(
        "Erreur",
        "Impossible de confirmer le rendez-vous. Veuillez réessayer."
      );
    }
  };
  
  // Ouvrir le modal de reprogrammation
  const openRescheduleModal = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setLoadingAvailabilities(true);
    
    try {
      // Récupérer les disponibilités du médecin
      const data = await doctorAPI.getMyAvailability();
      
      // Filtrer les disponibilités qui ne sont pas déjà réservées
      const availableSlots = data.filter((slot: Availability) => !slot.isBooked);
      
      setAvailabilities(availableSlots);
      setRescheduleModalVisible(true);
      setLoadingAvailabilities(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des disponibilités:', err);
      setLoadingAvailabilities(false);
      Alert.alert(
        "Erreur",
        "Impossible de récupérer vos disponibilités. Veuillez réessayer."
      );
    }
  };
  
  // Reprogrammer un rendez-vous
  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !selectedAvailability) {
      Alert.alert("Erreur", "Veuillez sélectionner un créneau de disponibilité.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Appel à l'API pour reprogrammer le rendez-vous
      const updatedAppointment = await doctorAPI.rescheduleAppointment(selectedAppointment._id, selectedAvailability);
      
      // Fermer le modal
      setRescheduleModalVisible(false);
      setSelectedAppointment(null);
      setSelectedAvailability('');
      
      // Trouver le créneau sélectionné pour mettre à jour l'UI
      const selectedSlot = availabilities.find(a => a._id === selectedAvailability);
      
      // Mettre à jour la liste des rendez-vous localement
      if (selectedSlot) {
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app._id === selectedAppointment._id 
              ? { 
                  ...app, 
                  status: 'rescheduled',
                  availability: {
                    ...app.availability,
                    date: selectedSlot.date,
                    startTime: selectedSlot.startTime,
                    endTime: selectedSlot.endTime
                  }
                } 
              : app
          )
        );
      } else {
        // Si on ne trouve pas le créneau, recharger tous les rendez-vous
        const data = await doctorAPI.getAppointments();
        setAppointments(data);
      }
      
      Alert.alert(
        "Rendez-vous reprogrammé",
        "Le rendez-vous a été reprogrammé avec succès."
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la reprogrammation:', err);
      setLoading(false);
      Alert.alert(
        "Erreur",
        "Impossible de reprogrammer le rendez-vous. Veuillez réessayer."
      );
    }
  };
  
  // Rendu du modal de reprogrammation
  const renderRescheduleModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={rescheduleModalVisible}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Reprogrammer le rendez-vous</ThemedText>
            
            {loadingAvailabilities ? (
              <ActivityIndicator size="large" color="#5586cc" style={{ marginVertical: 20 }} />
            ) : availabilities.length === 0 ? (
              <ThemedText style={styles.noAvailabilityText}>
                Aucune disponibilité trouvée. Veuillez créer de nouvelles disponibilités.
              </ThemedText>
            ) : (
              <ScrollView style={styles.availabilitiesList}>
                {availabilities.map((availability) => {
                  const isSelected = selectedAvailability === availability._id;
                  const date = format(new Date(availability.date), 'EEEE dd MMMM', { locale: fr });
                  const time = formatTime(availability.startTime);
                  
                  return (
                    <TouchableOpacity
                      key={availability._id}
                      style={[
                        styles.availabilityItem,
                        isSelected && styles.selectedAvailability
                      ]}
                      onPress={() => setSelectedAvailability(availability._id)}
                    >
                      <ThemedText style={styles.availabilityDate}>
                        {date}
                      </ThemedText>
                      <ThemedText style={styles.availabilityTime}>
                        {time}
                      </ThemedText>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#5586CC" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setRescheduleModalVisible(false);
                  setSelectedAppointment(null);
                  setSelectedAvailability('');
                }}
              >
                <ThemedText style={styles.buttonTextCancel}>Annuler</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedAvailability || loadingAvailabilities) && styles.disabledButton
                ]}
                onPress={rescheduleAppointment}
                disabled={!selectedAvailability || loadingAvailabilities}
              >
                <ThemedText style={styles.buttonText}>Confirmer</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Rendu de la sélection de date
  const renderDateSelector = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.dateSelector}
      >
        {dateOptions.map((date, index) => {
          const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateOption, isSelected && styles.selectedDateOption]}
              onPress={() => setSelectedDate(date)}
            >
              <ThemedText style={styles.dayName}>
                {format(date, 'EEE', { locale: fr })}
              </ThemedText>
              <ThemedText style={styles.dayNumber}>
                {format(date, 'dd')}
              </ThemedText>
              {isSelected && <View style={styles.selectedDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Rendu des rendez-vous
  const renderAppointments = () => {
    const filteredAppointments = getAppointmentsForDate();
    
    if (loading) {
      return <ActivityIndicator size="large" color="#5586cc" style={styles.loader} />;
    }
    
    if (error) {
      return <ThemedText style={styles.errorText}>{error}</ThemedText>;
    }
    
    if (!filteredAppointments.length) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Aucun rendez-vous pour cette date</ThemedText>
        </ThemedView>
      );
    }
    
    return filteredAppointments.map((appointment) => {
      const time = formatTime(appointment.availability.startTime);
      const patient = appointment.patient;
      
      // Définir la couleur en fonction du statut
      let statusColor = '#5586CC'; // Default: bleu pour "scheduled"
      if (appointment.status === 'pending') {
        statusColor = '#FFA500'; // Orange pour "pending"
      } else if (appointment.status === 'confirmed') {
        statusColor = '#5586CC'; // Bleu pour "confirmed"
      } else if (appointment.status === 'completed') {
        statusColor = '#4CAF50'; // Vert pour "completed"
      } else if (appointment.status === 'cancelled') {
        statusColor = '#DC3545'; // Rouge pour "cancelled"
      } else if (appointment.status === 'rescheduled') {
        statusColor = '#9C27B0'; // Violet pour "rescheduled"
      }

      // Texte du statut en français
      let statusText = 'Programmé';
      if (appointment.status === 'pending') {
        statusText = 'En attente';
      } else if (appointment.status === 'confirmed') {
        statusText = 'Confirmé';
      } else if (appointment.status === 'completed') {
        statusText = 'Terminé';
      } else if (appointment.status === 'cancelled') {
        statusText = 'Annulé';
      } else if (appointment.status === 'rescheduled') {
        statusText = 'Reprogrammé';
      }
      
      // Rendu du badge de statut de paiement
      const renderPaymentBadge = () => {
        if (appointment.paymentStatus === 'completed') {
          return (
            <View style={[styles.paymentBadge, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={12} color="white" />
              <ThemedText style={styles.paymentBadgeText}>Payé</ThemedText>
            </View>
          );
        } else if (appointment.paymentStatus === 'refunded') {
          return (
            <View style={[styles.paymentBadge, { backgroundColor: '#FFC107' }]}>
              <Ionicons name="return-down-back" size={12} color="white" />
              <ThemedText style={styles.paymentBadgeText}>Remboursé</ThemedText>
            </View>
          );
        } else {
          return (
            <View style={[styles.paymentBadge, { backgroundColor: '#F44336' }]}>
              <Ionicons name="alert-circle" size={12} color="white" />
              <ThemedText style={styles.paymentBadgeText}>Non payé</ThemedText>
            </View>
          );
        }
      };

      return (
        <View key={appointment._id} style={styles.timelineItem}>
          <View style={styles.timeContainer}>
            <ThemedText style={styles.timeText}>{time}</ThemedText>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          </View>
          
          <View style={[styles.appointmentCard, { borderLeftColor: statusColor }]}>
            <View style={styles.appointmentHeader}>
              <ThemedText style={styles.patientName}>
                {getPatientName(patient)}
              </ThemedText>
              {renderPaymentBadge()}
            </View>
            
            <ThemedText style={styles.caseNumber}>
              {appointment.caseDetails || 'Consultation standard'}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              {statusText}
            </ThemedText>
            
            <View style={styles.actionButtons}>
              {appointment.sessionLink && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => openZoomLink(appointment.sessionLink)}
                >
                  <Ionicons name="videocam-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Consultation</ThemedText>
                </TouchableOpacity>
              )}
              
              {appointment.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => confirmAppointment(appointment._id)}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Confirmer</ThemedText>
                </TouchableOpacity>
              )}
              
              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => openRescheduleModal(appointment)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Reprogrammer</ThemedText>
                </TouchableOpacity>
              )}
              
              {appointment.status === 'scheduled' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => updateAppointmentStatus(appointment._id, 'completed')}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Terminer</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  // Ouvrir le lien de consultation Zoom
  const openZoomLink = async (link?: string) => {
    if (!link) {
      Alert.alert("Erreur", "Aucun lien de consultation n'est disponible pour ce rendez-vous.");
      return;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(link);
      if (canOpen) {
        await Linking.openURL(link);
      } else {
        Alert.alert(
          "Erreur",
          "Impossible d'ouvrir le lien de consultation. Veuillez vérifier que vous avez l'application Zoom installée."
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du lien:', error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de l'ouverture du lien de consultation."
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <ThemedText style={styles.title}>Rendez-vous</ThemedText>
        <ThemedText style={styles.subtitle}>Aujourd&apos;hui</ThemedText>
        <ThemedText style={styles.dateHeader}>
          {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: fr })}
        </ThemedText>
      </View>
      
      {renderDateSelector()}
      
      <ScrollView style={styles.appointmentsContainer} showsVerticalScrollIndicator={false}>
        {renderAppointments()}
      </ScrollView>
      
      {renderRescheduleModal()}
      
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#0F2057" />
          <ThemedText style={[styles.navText, styles.activeNavText]}>Rendez-vous</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="time-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Disponibilités</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Patients</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Profil</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F2057',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6C757D',
    marginBottom: 5,
  },
  dateHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  dateSelector: {
    padding: 10,
  },
  dateOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#B5CDEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedDateOption: {
    backgroundColor: '#5586CC',
  },
  dayName: {
    fontSize: 14,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  appointmentsContainer: {
    flex: 1,
    marginTop: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeContainer: {
    width: 100,
    paddingRight: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5586CC',
  },
  appointmentCard: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#E6F0FF',
    borderLeftWidth: 3,
    borderLeftColor: '#5586CC',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  caseNumber: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  callButton: {
    backgroundColor: '#0F2057',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#FFA500',
  },
  rescheduleButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 5,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    marginTop: 30,
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 10,
    marginTop: 10,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    marginTop: 5,
    color: '#6C757D',
  },
  activeNavText: {
    color: '#0F2057',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  noAvailabilityText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  availabilitiesList: {
    maxHeight: 200,
    width: '100%',
  },
  availabilityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedAvailability: {
    backgroundColor: '#5586CC',
  },
  availabilityDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  availabilityTime: {
    fontSize: 14,
    color: '#6C757D',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    padding: 10,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#E5E5E5',
  },
  buttonTextCancel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 