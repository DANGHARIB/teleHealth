import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { format, parseISO, addDays } from 'date-fns';
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
  status: 'scheduled' | 'completed' | 'cancelled';
  caseDetails: string;
};

export default function AppointmentScreen() {
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
      const isAvailable = false; // Pour l'exemple des créneaux disponibles

      return (
        <View key={appointment._id} style={styles.timelineItem}>
          <View style={styles.timeContainer}>
            <ThemedText style={styles.timeText}>{time}</ThemedText>
          </View>
          
          <View style={[
            styles.appointmentCard, 
            isAvailable ? styles.availableCard : styles.bookedCard
          ]}>
            {isAvailable ? (
              <ThemedText style={styles.availableText}>Disponible</ThemedText>
            ) : (
              <>
                <ThemedText style={styles.patientName}>
                  {getDoctorName(doctor)}
                </ThemedText>
                <ThemedText style={styles.caseNumber}>
                  {appointment.caseDetails || 'Consultation standard'}
                </ThemedText>
                <TouchableOpacity style={styles.callButton}>
                  <ThemedText style={styles.callButtonText}>Call</ThemedText>
                </TouchableOpacity>
              </>
            )}
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
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
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
    width: 100,
    paddingRight: 10,
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 16,
    color: '#6C757D',
  },
  appointmentCard: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
  },
  bookedCard: {
    backgroundColor: '#E6F0FF',
    borderLeftWidth: 3,
    borderLeftColor: '#5586CC',
  },
  availableCard: {
    backgroundColor: '#E0FFED',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
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
    marginBottom: 10,
  },
  availableText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  callButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -15,
    backgroundColor: '#0F2057',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  activeNavItem: {
    // Style spécifique pour l'élément actif de la navigation
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