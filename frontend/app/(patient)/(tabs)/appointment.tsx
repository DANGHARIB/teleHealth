import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

// Types
type Appointment = {
  _id: string;
  doctor: {
    _id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  availability: {
    date: string;
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  caseDetails: string;
  sessionLink?: string;
  paymentStatus: 'pending' | 'completed' | 'refunded';
  price: number;
};

export default function AppointmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);

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
        console.log('Tentative de récupération des rendez-vous...');
        const data = await patientAPI.getAppointments();
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

  // Annuler un rendez-vous
  const cancelAppointment = async (appointmentId: string) => {
    try {
      // Confirmation de l'annulation
      Alert.alert(
        "Confirmation",
        "Êtes-vous sûr de vouloir annuler ce rendez-vous ?",
        [
          {
            text: "Non",
            style: "cancel"
          },
          {
            text: "Oui",
            onPress: async () => {
              setLoading(true);
              
              try {
                // Appel à l'API pour annuler le rendez-vous
                await patientAPI.cancelAppointment(appointmentId);
                
                // Mise à jour de la liste des rendez-vous
                setAppointments(prevAppointments => 
                  prevAppointments.map(app => 
                    app._id === appointmentId ? { ...app, status: 'cancelled' } : app
                  )
                );
                
                setLoading(false);
                Alert.alert("Succès", "Le rendez-vous a été annulé avec succès");
              } catch (error) {
                console.error('Erreur lors de l\'annulation du rendez-vous:', error);
                setLoading(false);
                Alert.alert("Erreur", "Impossible d'annuler le rendez-vous. Veuillez réessayer.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la confirmation d\'annulation:', error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    }
  };

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

  // Obtenir le nom complet du médecin
  const getDoctorName = (doctor: any) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Docteur';
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
      const doctor = appointment.doctor;
      
      // Déterminer le statut et la couleur correspondante
      let statusColor = '#5586CC'; // Bleu par défaut
      let statusText = 'Programmé';
      
      if (appointment.status === 'pending') {
        statusColor = '#FFA500'; // Orange pour "en attente"
        statusText = 'En attente de confirmation';
      } else if (appointment.status === 'confirmed') {
        statusColor = '#5586CC'; // Bleu pour "confirmé"
        statusText = 'Confirmé';
      } else if (appointment.status === 'completed') {
        statusColor = '#4CAF50'; // Vert pour "terminé"
        statusText = 'Terminé';
      } else if (appointment.status === 'cancelled') {
        statusColor = '#DC3545'; // Rouge pour "annulé"
        statusText = 'Annulé';
      } else if (appointment.status === 'rescheduled') {
        statusColor = '#9C27B0'; // Violet pour "reprogrammé"
        statusText = 'Reprogrammé';
      }

      // Afficher le badge de statut de paiement
      const renderPaymentBadge = () => {
        if (appointment.paymentStatus === 'completed') {
          return (
            <View style={styles.paymentBadgeContainer}>
              <View style={[styles.paymentBadge, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark-circle" size={12} color="white" />
                <ThemedText style={styles.paymentBadgeText}>Payé</ThemedText>
              </View>
            </View>
          );
        } else if (appointment.paymentStatus === 'refunded') {
          return (
            <View style={styles.paymentBadgeContainer}>
              <View style={[styles.paymentBadge, { backgroundColor: '#FFC107' }]}>
                <Ionicons name="return-down-back" size={12} color="white" />
                <ThemedText style={styles.paymentBadgeText}>Remboursé</ThemedText>
              </View>
            </View>
          );
        } else {
          return (
            <View style={styles.paymentBadgeContainer}>
              <View style={[styles.paymentBadge, { backgroundColor: '#F44336' }]}>
                <Ionicons name="alert-circle" size={12} color="white" />
                <ThemedText style={styles.paymentBadgeText}>Non payé</ThemedText>
              </View>
            </View>
          );
        }
      };

      // Ouvrir le lien de consultation Zoom
      const openZoomLink = async () => {
        if (appointment.sessionLink) {
          try {
            const canOpen = await Linking.canOpenURL(appointment.sessionLink);
            if (canOpen) {
              await Linking.openURL(appointment.sessionLink);
            } else {
              Alert.alert(
                "Erreur",
                "Impossible d'ouvrir le lien de consultation. Veuillez copier le lien manuellement."
              );
            }
          } catch (error) {
            Alert.alert(
              "Erreur",
              "Impossible d'ouvrir le lien de consultation."
            );
          }
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
              <ThemedText style={styles.doctorName}>
                {getDoctorName(doctor)}
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
              {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && appointment.sessionLink && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.joinButton]}
                  onPress={openZoomLink}
                >
                  <Ionicons name="videocam-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Rejoindre</ThemedText>
                </TouchableOpacity>
              )}
              
              {appointment.paymentStatus === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.payButton]}
                  onPress={() => router.push({
                    pathname: '/patient/payment',
                    params: { appointmentId: appointment._id }
                  })}
                >
                  <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Payer</ThemedText>
                </TouchableOpacity>
              )}
              
              {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelAppointment(appointment._id)}
                >
                  <Ionicons name="close-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Annuler</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <ThemedText style={styles.title}>Appointments</ThemedText>
        <ThemedText style={styles.subtitle}>Today</ThemedText>
        <ThemedText style={styles.dateHeader}>
          {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: fr })}
        </ThemedText>
      </View>
      
      {renderDateSelector()}
      
      <ScrollView style={styles.appointmentsContainer} showsVerticalScrollIndicator={false}>
        {renderAppointments()}
      </ScrollView>
      
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Financials</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Search</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#0F2057" />
          <ThemedText style={[styles.navText, styles.activeNavText]}>Appointment</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Profile</ThemedText>
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
    width: 80,
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
    marginLeft: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  doctorName: {
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
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: '#5586CC',
  },
  cancelButton: {
    backgroundColor: '#DC3545',
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
  payButton: {
    backgroundColor: '#FFA500',
  },
  paymentBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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