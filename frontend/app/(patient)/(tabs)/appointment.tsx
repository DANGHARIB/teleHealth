import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  Linking,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

const { width } = Dimensions.get('window');

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
  paymentStatus: 'completed' | 'refunded';
  price: number;
};

// Constants for scroll calculation
const DATE_OPTION_WIDTH = 56;
const DATE_OPTION_MARGIN = 12;
const DATE_SELECTOR_PADDING = 16;

const COLORS = {
  primary: '#7AA7CC',
  primaryLight: '#8FB5D5',
  primaryDark: '#6999BE',
  secondary: '#F8FAFC',
  accent: '#7AA7CC',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  purple: '#8B5CF6',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#090F47',
  white: '#FFFFFF',
  background: '#FAFBFE',
};

export default function AppointmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);
  
  // État pour le modal d'annulation
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [appointmentPrice, setAppointmentPrice] = useState<number>(0);
  
  // Ref for date selector ScrollView
  const dateScrollViewRef = useRef<ScrollView>(null);

  // Generate date options for the current week
  useEffect(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
    const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setDateOptions(dates);
  }, [currentWeek]);

  // Load appointments
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
  
  // Auto-scroll to selected date
  const scrollToSelectedDate = (targetDate: Date) => {
    const selectedIndex = dateOptions.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
    );
    
    if (selectedIndex > -1 && dateScrollViewRef.current) {
      // Calculate scroll position to center the selected date or show upcoming days
      const scrollX = Math.max(0, selectedIndex * (DATE_OPTION_WIDTH + DATE_OPTION_MARGIN) - DATE_SELECTOR_PADDING);
      
      dateScrollViewRef.current.scrollTo({
        x: scrollX,
        animated: true
      });
    }
  };

  // Navigation functions for weeks
  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    const today = new Date();
    
    // Vérifier si la nouvelle semaine est la semaine courante
    if (isSameWeek(newWeek, today, { weekStartsOn: 1 })) {
      // Pour la semaine courante, sélectionner le jour actuel
      setCurrentWeek(newWeek);
      setSelectedDate(today);
    } else {
      // Pour les autres semaines, sélectionner le lundi
      const mondayOfNewWeek = startOfWeek(newWeek, { weekStartsOn: 1 });
      setCurrentWeek(newWeek);
      setSelectedDate(mondayOfNewWeek);
    }
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const today = new Date();
    
    // Vérifier si la nouvelle semaine est la semaine courante
    if (isSameWeek(newWeek, today, { weekStartsOn: 1 })) {
      // Pour la semaine courante, sélectionner le jour actuel
      setCurrentWeek(newWeek);
      setSelectedDate(today);
    } else {
      // Pour les autres semaines, sélectionner le lundi
      const mondayOfNewWeek = startOfWeek(newWeek, { weekStartsOn: 1 });
      setCurrentWeek(newWeek);
      setSelectedDate(mondayOfNewWeek);
    }
  };

  const goToCurrentWeek = () => {
    // Pour la semaine courante, toujours sélectionner le jour actuel
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  };

  // Handle date selection with auto-scroll
  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    scrollToSelectedDate(date);
  };

  // Effect to auto-scroll when selectedDate changes (including week changes)
  useEffect(() => {
    if (dateOptions.length > 0) {
      // Delay the scroll to ensure the ScrollView is rendered
      setTimeout(() => {
        scrollToSelectedDate(selectedDate);
      }, 100);
    }
  }, [dateOptions, selectedDate]);
  
  // Initialisation: sélectionner la date actuelle au chargement
  useEffect(() => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  }, []);

  // Check if current week is this week
  const isCurrentWeek = isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });

  // Afficher le modal de confirmation d'annulation
  const showCancelConfirmation = (appointmentId: string, price: number, appointmentDate: string) => {
    // Vérifier si l'annulation est encore possible (J-2)
    if (!canCancelAppointment(appointmentDate)) {
      // Proposer la reprogrammation si possible (entre J-2 et J-1)
      if (canRescheduleAppointment(appointmentDate)) {
        Alert.alert(
          "Cannot Cancel",
          "This appointment can no longer be cancelled as it is less than 48 hours away. Would you like to reschedule instead?",
          [
            {
              text: "No",
              style: "cancel"
            },
            {
              text: "Reschedule",
              onPress: () => {
                // Rediriger vers la page de reprogrammation
                const appointment = appointments.find(app => app._id === appointmentId);
                if (appointment) {
                  router.push({
                    pathname: '/patient/doctor',
                    params: { doctorId: appointment.doctor._id }
                  });
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Cannot Cancel or Reschedule",
          "This appointment can no longer be cancelled or rescheduled as it is less than 24 hours away."
        );
      }
      return;
    }
    
    setAppointmentToCancel(appointmentId);
    setAppointmentPrice(price);
    setCancelModalVisible(true);
  };

  // Annuler un rendez-vous
  const cancelAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      
      // Appel à l'API pour annuler le rendez-vous
      await patientAPI.cancelAppointment(appointmentId);
      
      // Mise à jour de la liste des rendez-vous
      setAppointments(prevAppointments => 
        prevAppointments.map(app => {
          if (app._id === appointmentId) {
            // Si le rendez-vous a été payé, le marquer comme remboursé
            // Sinon, juste le marquer comme annulé et conserver son statut de paiement
            return { 
              ...app, 
              status: 'cancelled',
              paymentStatus: app.paymentStatus === 'completed' ? 'refunded' : app.paymentStatus
            };
          }
          return app;
        })
      );
      
      setLoading(false);
      setCancelModalVisible(false);
      
      // Afficher un message différent selon le statut de paiement
      const refundMessage = appointmentPrice > 0 
        ? `You will be refunded ${(appointmentPrice * 0.8).toFixed(2)}€ (80%). A penalty of ${(appointmentPrice * 0.2).toFixed(2)}€ (20%) will be retained.` 
        : '';
        
      Alert.alert(
        "Cancellation confirmed", 
        `The appointment has been successfully cancelled. ${refundMessage}`
      );
    } catch (err) {
      console.error('Error while cancelling the appointment:', err);
      setLoading(false);
      setCancelModalVisible(false);
      Alert.alert("Error", "Unable to cancel the appointment. Please try again.");
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

  // Get appointments for the selected date (for stats)
  const getTodayAppointments = () => {
    return getAppointmentsForDate();
  };
  
  // Vérification si un rendez-vous peut être annulé (jusqu'à J-2)
  const canCancelAppointment = (appointmentDate: string) => {
    try {
      // Convertir la date du rendez-vous en objet Date
      const appDate = new Date(appointmentDate);
      // Date limite d'annulation = date du rendez-vous - 2 jours
      const cancelDeadline = new Date(appDate);
      cancelDeadline.setDate(appDate.getDate() - 2);
      
      // Comparer avec la date actuelle
      const now = new Date();
      
      // On peut annuler si la date actuelle est avant la deadline d'annulation
      return now <= cancelDeadline;
    } catch (error) {
      console.error('Erreur lors de la vérification de la date d\'annulation:', error);
      return false;
    }
  };
  
  // Vérification si un rendez-vous peut être reprogrammé (jusqu'à J-1)
  const canRescheduleAppointment = (appointmentDate: string) => {
    try {
      // Convertir la date du rendez-vous en objet Date
      const appDate = new Date(appointmentDate);
      // Date limite de reprogrammation = date du rendez-vous - 1 jour
      const rescheduleDeadline = new Date(appDate);
      rescheduleDeadline.setDate(appDate.getDate() - 1);
      
      // Comparer avec la date actuelle
      const now = new Date();
      
      // On peut reprogrammer si la date actuelle est avant la deadline de reprogrammation
      return now <= rescheduleDeadline;
    } catch (error) {
      console.error('Erreur lors de la vérification de la date de reprogrammation:', error);
      return false;
    }
  };

  // Formater l'heure
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = Number(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  // Obtenir le nom complet du médecin
  const getDoctorName = (doctor: any) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Docteur';
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return {
          color: COLORS.primary,
          text: 'Confirmed',
          icon: 'checkmark-circle-outline'
        };
      case 'cancelled':
        return {
          color: COLORS.danger,
          text: 'Cancelled',
          icon: 'close-circle-outline'
        };
      case 'rescheduled':
        return {
          color: COLORS.purple,
          text: 'Rescheduled',
          icon: 'calendar-outline'
        };
      case 'completed':
        return {
          color: COLORS.success,
          text: 'Completed',
          icon: 'checkmark-done-circle-outline'
        };
      default:
        return {
          color: COLORS.warning,
          text: 'Pending',
          icon: 'time-outline'
        };
    }
  };

  // Render payment badge
  const renderPaymentBadge = (paymentStatus: string) => {
    // Les paiements sont automatiquement complétés lors de la sélection du rendez-vous
    // Seuls les états "Paid" et "Refunded" sont pertinents
    const config = {
      completed: {
        color: COLORS.success,
        text: 'Paid',
        icon: 'checkmark-circle'
      },
      refunded: {
        color: COLORS.warning,
        text: 'Refunded',
        icon: 'return-down-back'
      }
    }[paymentStatus] || { color: COLORS.success, text: 'Paid', icon: 'checkmark-circle' };

    return (
      <View style={[styles.paymentBadge, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon as any} size={12} color={COLORS.white} />
        <ThemedText style={styles.paymentBadgeText}>{config.text}</ThemedText>
      </View>
    );
  };

  // Ouvrir le lien de consultation Zoom
  const openZoomLink = async (link?: string) => {
    if (!link) {
      Alert.alert("Error", "No consultation link is available for this appointment.");
      return;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(link);
      if (canOpen) {
        await Linking.openURL(link);
      } else {
        Alert.alert(
          "Error",
          "Cannot open the consultation link. Please make sure you have the Zoom app installed."
        );
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(
        "Error",
        "An error occurred while opening the consultation link."
      );
    }
  };

  // Render week navigation header
  const renderWeekNavigation = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    // Include the year in the format
    const weekRange = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;

    return (
      <View style={styles.weekNavigationContainer}>
        <TouchableOpacity style={styles.weekNavButton} onPress={goToPreviousWeek}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <TouchableOpacity style={styles.weekRangeButton} onPress={goToCurrentWeek}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <ThemedText style={styles.weekRangeText}>{weekRange}</ThemedText>
            {!isCurrentWeek && (
              <View style={styles.currentWeekIndicator}>
                <ThemedText style={styles.currentWeekText}>Go to current</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.weekNavButton} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu de la sélection de date
  const renderDateSelector = () => {
    return (
      <View style={styles.dateSelectorContainer}>
        <ScrollView 
          ref={dateScrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.dateSelector}
        >
          {dateOptions.map((date, index) => {
            const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateOption,
                  isSelected && styles.selectedDateOption
                ]}
                onPress={() => handleDateSelection(date)}
              >
                <ThemedText style={[
                  styles.dayName,
                  isSelected && styles.selectedDateText
                ]}>
                  {format(date, 'EEE', { locale: enUS })}
                </ThemedText>
                <ThemedText style={[
                  styles.dayNumber,
                  isSelected && styles.selectedDateText
                ]}>
                  {format(date, 'dd')}
                </ThemedText>
                {isToday && !isSelected && (
                  <View style={styles.todayIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render appointments
  const renderAppointments = () => {
    const filteredAppointments = getAppointmentsForDate();
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <ThemedText style={styles.loadingText}>Loading appointments...</ThemedText>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      );
    }
    
    if (!filteredAppointments.length) {
      const dateText = format(selectedDate, 'MMMM dd, yyyy');
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.gray300} />
          <ThemedText style={styles.emptyTitle}>No appointments</ThemedText>
          <ThemedText style={styles.emptyText}>
            You have no appointments scheduled for {dateText}
          </ThemedText>
        </View>
      );
    }
    
    return filteredAppointments.map((appointment, index) => {
      const time = formatTime(appointment.availability.startTime);
      const endTime = formatTime(appointment.availability.endTime);
      const doctor = appointment.doctor;
      const statusConfig = getStatusConfig(appointment.status);
      
      return (
        <View key={appointment._id} style={styles.appointmentItem}>
          <View style={styles.timeContainer}>
            <View style={styles.timeBlock}>
              <ThemedText style={styles.timeText}>{time}</ThemedText>
              <ThemedText style={styles.endTimeText}>{endTime}</ThemedText>
            </View>
            <View style={[styles.timeIndicator, { backgroundColor: statusConfig.color }]} />
            {index < filteredAppointments.length - 1 && <View style={styles.timeConnector} />}
          </View>
          
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentContent}>
              <View style={styles.doctorInfo}>
                <ThemedText style={styles.doctorName}>
                  {getDoctorName(doctor)}
                </ThemedText>
                <ThemedText style={styles.caseDetails}>
                  {appointment.caseDetails || 'Standard consultation'}
                </ThemedText>
              </View>
              
              <View style={styles.badgesContainer}>
                <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                  <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                  <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.text}
                  </ThemedText>
                </View>
                {renderPaymentBadge(appointment.paymentStatus)}
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              {/* Bouton pour rejoindre l'appel vidéo si le rendez-vous est confirmé/programmé */}
              {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && appointment.sessionLink && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => openZoomLink(appointment.sessionLink)}
                >
                  <Ionicons name="videocam" size={16} color={COLORS.white} />
                  <ThemedText style={styles.buttonText}>Join Call</ThemedText>
                </TouchableOpacity>
              )}
              
              {/* Option de reprogrammation (possible jusqu'à J-1) */}
              {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'scheduled') && 
                canRescheduleAppointment(appointment.availability.date) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => router.push({
                    pathname: '/patient/doctor',
                    params: { doctorId: appointment.doctor._id }
                  })}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
                  <ThemedText style={styles.buttonText}>Reschedule</ThemedText>
                </TouchableOpacity>
              )}
              
              {/* Option d'annulation (possible jusqu'à J-2) */}
              {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'scheduled') && 
                canCancelAppointment(appointment.availability.date) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => showCancelConfirmation(appointment._id, appointment.price, appointment.availability.date)}
                >
                  <Ionicons name="close-outline" size={16} color={COLORS.white} />
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  // Rendu du modal d'annulation
  const renderCancelModal = () => {
    const refundAmount = (appointmentPrice * 0.8).toFixed(2);
    const penaltyAmount = (appointmentPrice * 0.2).toFixed(2);
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Cancellation Confirmation</ThemedText>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#DC3545" />
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.modalText}>
              You are about to cancel your appointment.
            </ThemedText>
            
            {appointmentPrice > 0 && (
              <View style={styles.penaltyContainer}>
                <ThemedText style={styles.warningText}>
                  Warning: A 20% penalty applies in case of cancellation.
                </ThemedText>
                
                <View style={styles.refundDetails}>
                  <ThemedText style={styles.refundText}>
                    Amount paid: {appointmentPrice}€
                  </ThemedText>
                  <ThemedText style={styles.refundText}>
                    Refund (80%): {refundAmount}€
                  </ThemedText>
                  <ThemedText style={styles.penaltyText}>
                    Penalty retained (20%): {penaltyAmount}€
                  </ThemedText>
                </View>
              </View>
            )}
            
            <ThemedText style={styles.modalQuestion}>
              Are you sure you want to continue?
            </ThemedText>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCancelModalVisible(false)}
              >
                <ThemedText style={styles.buttonText}>No, go back</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (appointmentToCancel) {
                    cancelAppointment(appointmentToCancel);
                  }
                }}
              >
                <ThemedText style={styles.buttonText}>Yes, cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{getTodayAppointments().length}</ThemedText>
            <ThemedText style={styles.statLabel}>Today&apos;s appointments</ThemedText>
          </View>
          <View style={styles.statDivider} />
          
        </View>
      </View>
      
      {renderWeekNavigation()}
      {renderDateSelector()}
      
      <ScrollView 
        style={styles.appointmentsContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.appointmentsContent}
      >
        {renderAppointments()}
      </ScrollView>
      
      {renderCancelModal()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  weekNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  weekRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}05`,
    position: 'relative',
    flexShrink: 1,
    width: '100%',
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginLeft: 8,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  currentWeekIndicator: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentWeekText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  dateSelectorContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dateSelector: {
    paddingVertical: 16,
    paddingHorizontal: DATE_SELECTOR_PADDING,
  },
  dateOption: {
    width: DATE_OPTION_WIDTH,
    height: 70,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DATE_OPTION_MARGIN,
    position: 'relative',
  },
  selectedDateOption: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectedDateText: {
    color: COLORS.white,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
  },
  appointmentsContainer: {
    flex: 1,
    marginTop: 24,
  },
  appointmentsContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  appointmentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeContainer: {
    width: 70,
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  timeBlock: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray700,
    marginBottom: 1,
  },
  endTimeText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  timeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  timeConnector: {
    position: 'absolute',
    top: 75,
    width: 2,
    height: 35,
    backgroundColor: COLORS.gray200,
  },
  appointmentCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appointmentContent: {
    marginBottom: 16,
  },
  doctorInfo: {
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 3,
  },
  caseDetails: {
    fontSize: 14,
    color: COLORS.gray500,
    lineHeight: 18,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  paymentBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 90,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
  },
  rescheduleButton: {
    backgroundColor: COLORS.purple,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray500,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginTop: 16,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray900,
    textAlign: 'center',
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    color: COLORS.gray700,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    color: COLORS.gray900,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: COLORS.danger,
  },
  penaltyContainer: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 10,
  },
  refundDetails: {
    marginTop: 10,
  },
  refundText: {
    fontSize: 14,
    marginBottom: 5,
    color: COLORS.gray700,
  },
  penaltyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginTop: 5,
  }
}); 