import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Linking,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

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
  };
  slotStartTime: string;
  slotEndTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rescheduled' | 'reschedule_requested';
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

// Type pour l'utilisateur authentifié
type AuthUser = {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
};

// Type pour le contexte d'authentification
type AuthContextType = {
  user: AuthUser | null;
  authToken?: string | null;
  loading?: boolean;
  signIn?: (email: string, password: string) => Promise<any>;
  signUp?: (userData: any) => Promise<any>;
  signOut?: () => Promise<any>;
  updateUserProfile?: (updatedData: any) => Promise<any>;
  isAuthenticated?: boolean;
};

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

// Constants for scroll calculation
const DATE_OPTION_WIDTH = 56;
const DATE_OPTION_MARGIN = 12;
const DATE_SELECTOR_PADDING = 16;

export default function DoctorAppointmentScreen() {
  const { user } = useAuth() as AuthContextType;
  const router = useRouter(); // Add useRouter
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  
  // Ref for date selector ScrollView
  const dateScrollViewRef = useRef<ScrollView>(null);

  // Generate date options for the current week
  useEffect(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Commencer le lundi
    const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setDateOptions(dates);
  }, [currentWeek]);

  // Load doctor profile
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const data = await doctorAPI.getProfile();
        console.log('Doctor profile loaded:', data);
        setDoctorProfile(data);
      } catch (err) {
        console.error('Error loading doctor profile:', err);
      }
    };

    fetchDoctorProfile();
  }, []);

  // Load appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log('Fetching doctor appointments...');
        const data = await doctorAPI.getAppointments();
        console.log('Appointments fetched successfully:', data ? data.length : 0);
        setAppointments(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading appointments:', err);
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

  // Check if current week is this week
  const isCurrentWeek = isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });

  // Filter appointments by date
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

  // Format time
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

  // Get patient full name
  const getPatientName = (patient: any) => {
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient';
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

  // Update appointment status (utilisé uniquement pour reprogrammation et autres changements de statut)
  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'scheduled' | 'cancelled') => {
    try {
      await doctorAPI.updateAppointmentStatus(appointmentId, { status: newStatus });
      
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app._id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };
  
  // Les rendez-vous sont automatiquement confirmés après paiement

  // Vérifier si un rendez-vous est passé (slot de fin est dépassé)
  const isAppointmentPast = (appointment: Appointment) => {
    try {
      const now = new Date();
      const appointmentDate = new Date(appointment.availability.date);
      const [hours, minutes] = appointment.slotEndTime.split(':').map(Number);
      
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      return now > appointmentDate;
    } catch (error) {
      console.error('Erreur lors de la vérification de la date du rendez-vous:', error);
      return false;
    }
  };

  // Naviguer vers l'écran des notes
  const navigateToNotes = (appointment: Appointment) => {
    // Vérifier d'abord si une note existe déjà
    doctorAPI.checkNoteExists(appointment._id)
      .then(({ exists, noteId }) => {
        if (exists && noteId) {
          // Si une note existe, naviguer vers l'édition de la note
          router.push(`/doctor/notes/${noteId}`);
        } else {
          // Sinon, naviguer vers la création d'une nouvelle note
          router.push({
            pathname: '/doctor/notes/create',
            params: { appointmentId: appointment._id }
          });
        }
      })
      .catch(error => {
        console.error('Erreur lors de la vérification des notes:', error);
        Alert.alert('Erreur', 'Impossible de vérifier les notes existantes.');
      });
  };

  // Navigate to reschedule screen
  const navigateToReschedule = (appointment: Appointment) => {
    if (!canRescheduleAppointment(appointment.availability.date)) {
      Alert.alert(
        "Impossible de reprogrammer",
        "Ce rendez-vous ne peut plus être reprogrammé car il est prévu dans moins de 24 heures."
      );
      return;
    }
    
    Alert.alert(
      "Demander une reprogrammation",
      `Êtes-vous sûr de vouloir demander au patient de reprogrammer son rendez-vous du ${format(new Date(appointment.availability.date), 'dd/MM/yyyy')} à ${appointment.slotStartTime} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: async () => {
            try {
              setLoading(true);
              await doctorAPI.requestRescheduleAppointment(appointment._id);
              
              // Mettre à jour le statut du rendez-vous localement
              setAppointments(prevAppointments => 
                prevAppointments.map(app => 
                  app._id === appointment._id ? { ...app, status: "reschedule_requested" } : app
                )
              );
              
              Alert.alert(
                "Demande envoyée",
                "Une notification a été envoyée au patient pour lui demander de reprogrammer ce rendez-vous."
              );
            } catch (error) {
              console.error("Erreur lors de la demande de reprogrammation:", error);
              Alert.alert(
                "Erreur",
                "Une erreur est survenue lors de la demande de reprogrammation."
              );
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  // Render week navigation header
  const renderWeekNavigation = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
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

  // Render date selector
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

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return {
          color: COLORS.primary,
          text: 'Confirmé',
          icon: 'checkmark-circle-outline'
        };
      case 'cancelled':
        return {
          color: COLORS.danger,
          text: 'Annulé',
          icon: 'close-circle-outline'
        };
      case 'rescheduled':
        return {
          color: COLORS.purple,
          text: 'Reprogrammé',
          icon: 'calendar-outline'
        };
      case 'reschedule_requested':
        return {
          color: COLORS.warning,
          text: 'Reprog. demandée',
          icon: 'time-outline'
        };
      default:
        return {
          color: COLORS.warning,
          text: 'En attente',
          icon: 'time-outline'
        };
    }
  };

  // Render payment badge
  const renderPaymentBadge = (paymentStatus: string) => {
    const config = {
      completed: {
        color: COLORS.success,
        text: 'Paid',
        icon: 'checkmark-circle'
      },
      refunded: {
        color: COLORS.warning,
        text: 'Refunded',
        icon: 'refresh-circle'
      }
    }[paymentStatus] || { color: COLORS.success, text: 'Paid', icon: 'checkmark-circle' };

    return (
      <View style={[styles.paymentBadge, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon as any} size={12} color={COLORS.white} />
        <ThemedText style={styles.paymentBadgeText}>{config.text}</ThemedText>
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
      const time = formatTime(appointment.slotStartTime);
      const endTime = formatTime(appointment.slotEndTime);
      const patient = appointment.patient;
      const statusConfig = getStatusConfig(appointment.status);
      
      // Sort appointments by time
      filteredAppointments.sort((a, b) => {
        return a.slotStartTime.localeCompare(b.slotStartTime);
      });
      
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
              <View style={styles.patientInfo}>
                <ThemedText style={styles.patientName}>
                  {getPatientName(patient)}
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
              {appointment.sessionLink && appointment.status !== 'cancelled' && (
                <>
                  {isAppointmentPast(appointment) ? (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={() => navigateToNotes(appointment)}
                    >
                      <Ionicons name="document-text" size={16} color={COLORS.white} />
                      <ThemedText style={styles.buttonText}>Notes</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.primaryButton]}
                      onPress={() => openZoomLink(appointment.sessionLink)}
                    >
                      <Ionicons name="videocam" size={16} color={COLORS.white} />
                      <ThemedText style={styles.buttonText}>Join Call</ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {/* Option de reprogrammation disponible jusqu'à J-1 */}
              {['confirmed', 'scheduled'].includes(appointment.status) && 
               canRescheduleAppointment(appointment.availability.date) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={() => navigateToReschedule(appointment)}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
                  <ThemedText style={styles.buttonText}>Reschedule</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  // Open Zoom link
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

  // Initialisation: sélectionner la date actuelle au chargement
  useEffect(() => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  }, []);

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
  patientInfo: {
    marginBottom: 12,
  },
  patientName: {
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
  successButton: {
    backgroundColor: COLORS.success,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
  },
  rescheduleButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    marginLeft: 0,
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
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  modalLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noAvailabilityContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  noAvailabilityText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray700,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAvailabilitySubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  availabilitiesList: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  availabilityItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedAvailability: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray100,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  availabilityTime: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  selectedAvailabilityText: {
    color: COLORS.white,
  },
  selectedIndicator: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  disabledButton: {
    backgroundColor: COLORS.gray300,
  },
});
