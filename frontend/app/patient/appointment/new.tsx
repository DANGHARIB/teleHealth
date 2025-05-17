import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, parseISO, isToday, isTomorrow, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI, patientAPI } from '@/services/api';

// Types
type Doctor = {
  _id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  price?: number;
  rating?: number;
};

type Availability = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
};

type TimeSlot = {
  _id: string;
  time: string;
  available: boolean;
};

type DateOption = {
  date: Date;
  formattedDate: string;
  dayName: string;
  dayNumber: string;
};

export default function BookAppointmentScreen() {
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');

  // Charger les détails du médecin
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        if (!doctorId) return;
        
        setLoading(true);
        const doctorData = await doctorAPI.getDoctorById(doctorId as string);
        setDoctor(doctorData);
        
        // Obtenir les dates disponibles
        await fetchAvailableDates();
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du médecin:', err);
        setError('Impossible de charger les détails du médecin');
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  // Récupérer les dates disponibles pour les 14 prochains jours
  const fetchAvailableDates = async () => {
    try {
      if (!doctorId) return;
      
      // Créer un tableau de dates pour les 14 prochains jours
      const today = new Date();
      const dates: DateOption[] = [];
      
      // Ajouter les 14 prochains jours
      for (let i = 0; i < 14; i++) {
        const date = addDays(today, i);
        
        // Vérifier si ce jour a des disponibilités
        const formattedDate = format(date, 'yyyy-MM-dd');
        const availabilities = await patientAPI.getDoctorAvailability(doctorId as string, formattedDate);
        
        if (availabilities && availabilities.length > 0) {
          dates.push({
            date: date,
            formattedDate: formattedDate,
            dayName: format(date, 'EEE', { locale: fr }),
            dayNumber: format(date, 'd'),
          });
        }
      }
      
      setAvailableDates(dates);
      
      // Définir le mois actuel
      setCurrentMonth(format(today, 'MMMM', { locale: fr }));
      
      // Sélectionner la première date disponible par défaut
      if (dates.length > 0) {
        setSelectedDate(dates[0].date);
        fetchTimeSlots(dates[0].formattedDate);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des dates disponibles:', err);
      setError('Impossible de charger les dates disponibles');
    }
  };

  // Récupérer les créneaux horaires pour une date spécifique
  const fetchTimeSlots = async (date: string) => {
    try {
      setLoadingSlots(true);
      
      const availabilities = await patientAPI.getDoctorAvailability(doctorId as string, date);
      
      // Convertir les disponibilités en créneaux horaires
      const slots: TimeSlot[] = availabilities.map((avail: Availability) => ({
        _id: avail._id,
        time: avail.startTime,
        available: true
      }));
      
      setTimeSlots(slots);
      setSelectedTimeSlot(null);
      setLoadingSlots(false);
    } catch (err) {
      console.error('Erreur lors du chargement des créneaux horaires:', err);
      setTimeSlots([]);
      setLoadingSlots(false);
    }
  };

  // Sélectionner une date
  const handleDateSelect = (date: Date, formattedDate: string) => {
    setSelectedDate(date);
    fetchTimeSlots(formattedDate);
  };

  // Sélectionner un créneau horaire
  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };

  // Réserver le rendez-vous
  const handleBookAppointment = async () => {
    if (!selectedTimeSlot || !doctorId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date et un horaire');
      return;
    }

    try {
      const appointmentData = {
        doctorId: doctorId,
        availabilityId: selectedTimeSlot,
        price: doctor?.price || 28,
        duration: 30, // Durée par défaut en minutes
        caseDetails: 'Consultation standard'
      };

      const createdAppointment = await patientAPI.createAppointment(appointmentData);
      
      // Rediriger vers la page de paiement au lieu de la page d'accueil
      router.push({
        pathname: '/patient/payment',
        params: { appointmentId: createdAppointment._id }
      });
    } catch (err) {
      console.error('Erreur lors de la réservation du rendez-vous:', err);
      Alert.alert('Erreur', 'Impossible de réserver le rendez-vous. Veuillez réessayer.');
    }
  };

  // Obtenir une image par défaut si celle du médecin n'est pas disponible
  const getDefaultImage = () => require('@/assets/images/icon.png');
  
  // Obtenir le nom complet du médecin
  const getDoctorName = (doctor: Doctor) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  };

  // Afficher les étoiles de notation
  const renderRatingStars = (rating: number = 4) => {
    const stars = [];
    const maxStars = 5;
    
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={24} 
          color="#FFD700" 
        />
      );
    }
    
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  // Formater un jour pour l'affichage
  const formatDayLabel = (date: Date) => {
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, 'EEEE', { locale: fr });
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Prendre un Rendez-vous',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
            color: '#14104B'
          },
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : error ? (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : doctor ? (
        <ScrollView style={styles.container}>
          {/* Carte du médecin */}
          <ThemedView style={styles.doctorCard}>
            <View style={styles.doctorProfile}>
              <Image
                source={doctor.doctor_image ? { uri: doctor.doctor_image } : getDefaultImage()}
                style={styles.doctorImage}
                contentFit="cover"
              />
              
              <View style={styles.doctorInfo}>
                <ThemedText type="title" style={styles.doctorName}>
                  Dr. {getDoctorName(doctor)}
                </ThemedText>
                
                {renderRatingStars(doctor.rating)}
                
                <ThemedText style={styles.priceText}>
                  $ {doctor.price ? doctor.price.toFixed(2) : '28.00'}/session
                </ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.experienceText}>
              {doctor.experience} Years experience
            </ThemedText>
          </ThemedView>

          {/* Sélection de date */}
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Select Date
              </ThemedText>
              
              <View style={styles.monthSelector}>
                <TouchableOpacity style={styles.monthNav}>
                  <Ionicons name="chevron-back" size={24} color="#666" />
                </TouchableOpacity>
                
                <ThemedText style={styles.monthName}>
                  {currentMonth}
                </ThemedText>
                
                <TouchableOpacity style={styles.monthNav}>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateList}
            >
              {availableDates.map((dateOption) => (
                <TouchableOpacity
                  key={dateOption.formattedDate}
                  style={[
                    styles.dateItem,
                    selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateOption.formattedDate && styles.selectedDateItem
                  ]}
                  onPress={() => handleDateSelect(dateOption.date, dateOption.formattedDate)}
                >
                  <ThemedText 
                    style={[
                      styles.dateNumber,
                      selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateOption.formattedDate && styles.selectedDateText
                    ]}
                  >
                    {dateOption.dayNumber}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.dateDay,
                      selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateOption.formattedDate && styles.selectedDateText
                    ]}
                  >
                    {dateOption.dayName}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>

          {/* Sélection d'horaire */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Select Time
            </ThemedText>
            
            {loadingSlots ? (
              <ActivityIndicator size="small" color="#0000ff" style={styles.slotLoader} />
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot._id}
                      style={[
                        styles.timeSlot,
                        selectedTimeSlot === slot._id && styles.selectedTimeSlot
                      ]}
                      onPress={() => handleTimeSlotSelect(slot._id)}
                      disabled={!slot.available}
                    >
                      <ThemedText 
                        style={[
                          styles.timeText,
                          selectedTimeSlot === slot._id && styles.selectedTimeText
                        ]}
                      >
                        {slot.time}
                      </ThemedText>
                    </TouchableOpacity>
                  ))
                ) : (
                  <ThemedText style={styles.noSlotsText}>
                    Aucun créneau disponible pour cette date
                  </ThemedText>
                )}
              </View>
            )}
          </ThemedView>

          {/* Bouton de réservation */}
          <TouchableOpacity 
            style={[
              styles.bookButton,
              (!selectedDate || !selectedTimeSlot) && styles.disabledButton
            ]}
            onPress={handleBookAppointment}
            disabled={!selectedDate || !selectedTimeSlot}
          >
            <ThemedText style={styles.bookButtonText}>
              Book Appointment
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Médecin non trouvé</ThemedText>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotLoader: {
    margin: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorProfile: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  doctorImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14104B',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 18,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  experienceText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    marginTop: 0,
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14104B',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthNav: {
    padding: 5,
  },
  monthName: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
    marginHorizontal: 10,
  },
  dateList: {
    paddingVertical: 10,
  },
  dateItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDateItem: {
    backgroundColor: '#14104B',
    borderColor: '#14104B',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateDay: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  selectedDateText: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeSlot: {
    width: '31%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTimeSlot: {
    backgroundColor: '#14104B',
    borderColor: '#14104B',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  bookButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    padding: 18,
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 