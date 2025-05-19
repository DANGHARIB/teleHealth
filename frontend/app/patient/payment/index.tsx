import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

// App theme colors - matching the rest of the app
const COLORS = {
  primary: '#7AA7CC',
  primaryDark: '#6999BE',
  secondary: '#F8FAFC',
  accent: '#7AA7CC',
  darkNavy: '#090F47',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  textLight: '#6B7280',
  textDark: '#0F172A',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  white: '#FFFFFF',
};

// Type pour l'objet appointment
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
  slotStartTime: string; // The specific time slot selected by the patient
  slotEndTime: string;   // The end time of the selected slot
  status: 'pending' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  caseDetails: string;
  sessionLink?: string;
  paymentStatus: 'pending' | 'completed' | 'refunded';
  price: number;
};

// Type pour les méthodes de paiement sauvegardées
type PaymentMethod = {
  _id: string;
  name: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFourDigits?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardType?: string;
  isDefault: boolean;
};

// Helper function to format time strings
const formatTimeString = (timeString: string): string => {
  // Handle common time formats
  if (timeString.includes('T')) {
    // If it's an ISO format like "2023-08-15T16:30:00.000Z"
    return format(new Date(timeString), 'h:mm a');
  } else if (timeString.includes(':')) {
    // If it's just a time like "16:30"
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'h:mm a');
  }
  // Return as is if format not recognized
  return timeString;
};

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  
  // Nouveau state pour les méthodes de paiement sauvegardées
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string | null>(null);
  const [loadingSavedMethods, setLoadingSavedMethods] = useState(false);
  
  // Charger les détails du rendez-vous
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        
        if (!appointmentId) {
          Alert.alert('Error', 'Missing appointment ID');
          router.back();
          return;
        }
        
        const appointments = await patientAPI.getAppointments();
        const foundAppointment = appointments.find((app: Appointment) => app._id === appointmentId);
        
        if (!foundAppointment) {
          Alert.alert('Error', 'Appointment not found');
          router.back();
          return;
        }
        
        console.log('Selected appointment time slot:', {
          startTime: foundAppointment.availability.startTime,
          endTime: foundAppointment.availability.endTime,
          date: foundAppointment.availability.date,
          fullAppointment: foundAppointment
        });
        
        setAppointment(foundAppointment);
        setLoading(false);
        
        // Charger les méthodes de paiement sauvegardées
        fetchSavedPaymentMethods();
      } catch (error) {
        console.error('Error loading appointment details:', error);
        Alert.alert('Error', 'Unable to load appointment details');
        setLoading(false);
        router.back();
      }
    };
    
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  // Gérer le cas où l'utilisateur quitte la page
  useEffect(() => {
    // Fonction de nettoyage exécutée quand le composant est démonté
    return () => {
      // Si le processus de paiement n'est pas en cours et que le rendez-vous est toujours en attente
      if (!processingPayment && appointment && appointment.paymentStatus === 'pending') {
        // On pourrait ajouter ici une logique côté client pour annuler le rendez-vous
        // Mais c'est préférable de laisser le backend faire ce nettoyage avec un job périodique
        console.log('Utilisateur a quitté la page de paiement sans finaliser');
      }
    };
  }, [processingPayment, appointment]);
  
  // Charger les méthodes de paiement sauvegardées
  const fetchSavedPaymentMethods = async () => {
    try {
      setLoadingSavedMethods(true);
      const methods = await patientAPI.getSavedPaymentMethods();
      setSavedPaymentMethods(methods);
      
      // Sélectionner la méthode par défaut s'il y en a une
      const defaultMethod = methods.find((m: PaymentMethod) => m.isDefault);
      if (defaultMethod) {
        setSelectedSavedMethod(defaultMethod._id);
        setSelectedMethod(defaultMethod.type);
      }
      
      setLoadingSavedMethods(false);
    } catch (error) {
      console.error('Erreur lors du chargement des méthodes de paiement:', error);
      setLoadingSavedMethods(false);
    }
  };
  
  // Traiter le paiement
  const processPayment = async () => {
    if (!appointment) return;
    
    setProcessingPayment(true);
    
    try {
      // Simuler un délai de traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Préparer les données de paiement
      let paymentData: {
        appointmentId: string;
        paymentMethod: string;
        amount: number;
        savedPaymentMethodId?: string;
      } = {
        appointmentId: appointment._id,
        paymentMethod: selectedMethod,
        amount: appointment.price
      };
      
      // Si une méthode sauvegardée est sélectionnée, ajouter son ID
      if (selectedSavedMethod) {
        paymentData.savedPaymentMethodId = selectedSavedMethod;
      }
      
      // Appel à l'API pour créer le paiement
      await patientAPI.createPayment(paymentData);
      
      setProcessingPayment(false);
      Alert.alert(
        'Payment Successful',
        'Your payment has been processed successfully.',
        [{ text: 'OK', onPress: () => router.push('/(patient)/(tabs)/payments') }]
      );
    } catch (error) {
      console.error('Payment error:', error);
      setProcessingPayment(false);
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };
  
  // Rendu des méthodes de paiement sauvegardées
  const renderSavedPaymentMethods = () => {
    if (loadingSavedMethods) {
      return (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.methodsLoader} />
      );
    }
    
    if (savedPaymentMethods.length === 0) {
      return (
        <View style={styles.noSavedMethodsContainer}>
          <ThemedText style={styles.noSavedMethodsText}>
            You don't have any saved payment methods yet
          </ThemedText>
          <TouchableOpacity 
            style={styles.addPaymentMethodButton}
            onPress={() => router.push('/patient/profile/add-payment-method')}
          >
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <ThemedText style={styles.addPaymentMethodText}>
              Add a payment method
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.savedMethodsContainer}>
        <ThemedText style={styles.savedMethodsTitle}>
          Your saved payment methods
        </ThemedText>
        
        {savedPaymentMethods.map(method => (
          <TouchableOpacity
            key={method._id}
            style={[
              styles.savedMethodItem,
              selectedSavedMethod === method._id && styles.selectedSavedMethod
            ]}
            onPress={() => {
              setSelectedSavedMethod(method._id);
              setSelectedMethod(method.type);
            }}
          >
            <View style={styles.savedMethodIcon}>
              <Ionicons 
                name={getMethodIcon(method.type)} 
                size={24} 
                color={selectedSavedMethod === method._id ? COLORS.white : COLORS.textDark} 
              />
            </View>
            <View style={styles.savedMethodInfo}>
              <ThemedText 
                style={selectedSavedMethod === method._id ? styles.selectedMethodText : styles.methodText}
              >
                {method.name}
              </ThemedText>
              {method.type === 'card' && method.lastFourDigits && (
                <ThemedText 
                  style={[
                    styles.savedMethodDetails,
                    selectedSavedMethod === method._id && styles.selectedMethodDetails
                  ]}
                >
                  •••• {method.lastFourDigits} | Exp: {method.expiryMonth}/{method.expiryYear}
                </ThemedText>
              )}
            </View>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <ThemedText style={styles.defaultBadgeText}>Default</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={styles.addNewMethodButton}
          onPress={() => {
            setSelectedSavedMethod(null);
            router.push('/patient/profile/add-payment-method');
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <ThemedText style={styles.addNewMethodText}>
            Use another payment method
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Obtenir l'icône en fonction du type de méthode
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return 'card-outline';
      case 'paypal': return 'logo-paypal';
      case 'apple_pay': return 'logo-apple';
      case 'google_pay': return 'logo-google';
      default: return 'card-outline';
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <ThemedText style={styles.loadingText}>Loading appointment details...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Payment',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.appointmentCard}>
          <ThemedText style={styles.cardTitle}>Appointment Details</ThemedText>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Doctor:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.doctor?.full_name || 'Doctor Name'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.availability?.date ? format(parseISO(appointment.availability.date), 'MMM d, yyyy') : 'Not available'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Time:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.slotStartTime && appointment?.slotEndTime 
                ? `${formatTimeString(appointment.slotStartTime)} - ${formatTimeString(appointment.slotEndTime)}`
                : 'Not available'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Type:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.caseDetails || 'Standard consultation'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.paymentSummary}>
          <ThemedText style={styles.paymentTitle}>Payment Summary</ThemedText>
          
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Consultation fee:</ThemedText>
            <ThemedText style={styles.priceValue}>${appointment?.price || 28}</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.methodsTitle}>Payment Method</ThemedText>
        
        {/* Afficher les méthodes de paiement sauvegardées */}
        {renderSavedPaymentMethods()}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.payButton,
            savedPaymentMethods.length === 0 && styles.disabledButton
          ]}
          onPress={processPayment}
          disabled={processingPayment || savedPaymentMethods.length === 0}
        >
          {processingPayment ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <ThemedText style={styles.payButtonText}>
              {savedPaymentMethods.length === 0 
                ? "Add a payment method to continue" 
                : `Pay $${appointment?.price || 28}`}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  paymentSummary: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 16,
  },
  paymentMethods: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  selectedPaymentMethod: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginVertical: 4,
    borderBottomWidth: 0,
  },
  paymentMethodIcon: {
    width: 40,
    alignItems: 'center',
  },
  methodText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  selectedMethodText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    backgroundColor: COLORS.cardBackground,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  disabledButton: {
    backgroundColor: COLORS.gray200,
  },
  // Styles pour les méthodes de paiement sauvegardées
  methodsLoader: {
    marginVertical: 20,
  },
  savedMethodsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedMethodsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  savedMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.gray100,
  },
  selectedSavedMethod: {
    backgroundColor: COLORS.primary,
  },
  savedMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedMethodInfo: {
    flex: 1,
  },
  savedMethodDetails: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  selectedMethodDetails: {
    color: COLORS.gray300,
  },
  defaultBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '500',
  },
  addNewMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    marginTop: 8,
  },
  addNewMethodText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  noSavedMethodsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noSavedMethodsText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  addPaymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  addPaymentMethodText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
}); 