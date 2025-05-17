import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { format, parseISO, addDays } from 'date-fns';
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
  status: 'scheduled' | 'completed' | 'cancelled';
  caseDetails: string;
  sessionLink?: string;
};

export default function DoctorAppointmentScreen() {
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
      const statusColor = appointment.status === 'scheduled' ? '#5586CC' : 
                          appointment.status === 'completed' ? '#4CAF50' : '#DC3545';

      return (
        <View key={appointment._id} style={styles.timelineItem}>
          <View style={styles.timeContainer}>
            <ThemedText style={styles.timeText}>{time}</ThemedText>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          </View>
          
          <View style={[styles.appointmentCard, { borderLeftColor: statusColor }]}>
            <ThemedText style={styles.patientName}>
              {getPatientName(patient)}
            </ThemedText>
            <ThemedText style={styles.caseNumber}>
              {appointment.caseDetails || 'Consultation standard'}
            </ThemedText>
            <ThemedText style={styles.statusText}>
              {appointment.status === 'scheduled' ? 'Programmé' : 
               appointment.status === 'completed' ? 'Terminé' : 'Annulé'}
            </ThemedText>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={() => {/* Implémentation d'appel ultérieure */}}
              >
                <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Appeler</ThemedText>
              </TouchableOpacity>
              
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
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
    marginBottom: 5,
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
}); 