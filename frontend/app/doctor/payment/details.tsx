import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';

// App theme colors
const COLORS = {
  darkNavy: '#090F47',  // Dark navy for headings and important information
  babyBlue: '#7AA7CC',  // Baby blue for secondary text and accents
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  error: '#EF4444',
  pending: '#FFA500',
  refunded: '#FF9999',  // Light pastel red for refunds
  failed: '#DC3545',
  completed: '#7AA7CC',
  textLight: '#8F9BB3',
};

// Payment type
type Payment = {
  _id: string;
  appointment: {
    _id: string;
    availability: {
      date: string;
      startTime: string;
      endTime: string;
    };
    patient: {
      _id: string;
      first_name?: string;
      last_name?: string;
    };
    status: string;
    caseDetails: string;
  };
  patient: {
    _id: string;
    first_name: string;
    last_name: string;
  };
  amount: number;
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transactionId: string;
  paymentDate: string;
  createdAt: string;
};

export default function PaymentDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load payment details
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        
        if (!paymentId) {
          Alert.alert('Error', 'Missing payment ID');
          router.back();
          return;
        }
        
        // First get all doctor's payments
        const payments = await doctorAPI.getPayments();
        const foundPayment = payments.find((p: Payment) => p._id === paymentId);
        
        if (!foundPayment) {
          setError('Payment not found');
          setLoading(false);
          return;
        }
        
        setPayment(foundPayment);
        setLoading(false);
      } catch (error) {
        console.error('Error loading payment:', error);
        setError('Unable to load payment details');
        setLoading(false);
      }
    };
    
    fetchPaymentDetails();
  }, [paymentId]);
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      // Format US: Month Day, Year • Hour:Minute AM/PM
      return format(date, 'MMMM dd, yyyy • h:mm a', { locale: enUS });
    } catch (error) {
      console.log('Error formatting date:', error);
      return 'Date invalide';
    }
  };
  
  // Fonction pour créer une date à partir de date + time séparément
  const combineDateTime = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr) return '';
    
    // Si pas d'heure fournie, retourner juste la date
    if (!timeStr) return dateStr;
    
    try {
      // Nettoyer le format de la date
      // Supprimer le 'T' et tout ce qui suit s'il existe déjà dans la date
      let cleanDate = dateStr;
      if (dateStr.includes('T')) {
        cleanDate = dateStr.split('T')[0];
      }
      
      // Nettoyer le format de l'heure, supprimer le 'Z' et tout ce qui suit
      let cleanTime = timeStr;
      if (timeStr.includes('Z')) {
        cleanTime = timeStr.split('Z')[0];
      }
      if (timeStr.includes('.')) {
        cleanTime = timeStr.split('.')[0];
      }
      
      // Construire une date ISO standard
      return `${cleanDate}T${cleanTime}`;
    } catch (e) {
      console.error('Error combining date and time:', e);
      return dateStr;
    }
  };
  
  // Get patient's full name
  const getPatientName = (patient: any) => {
    if (!patient) return 'Unknown patient';
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  };
  
  // Render payment method
  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'card':
        return { icon: 'card-outline', label: 'Credit Card' };
      case 'paypal':
        return { icon: 'logo-paypal', label: 'PayPal' };
      case 'apple_pay':
        return { icon: 'logo-apple', label: 'Apple Pay' };
      case 'google_pay':
        return { icon: 'logo-google', label: 'Google Pay' };
      default:
        return { icon: 'card-outline', label: 'Unknown method' };
    }
  };
  
  // Render payment status
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: COLORS.pending, label: 'Pending' };
      case 'completed':
        return { color: COLORS.completed, label: 'Completed' };
      case 'refunded':
        return { color: COLORS.refunded, label: 'Refunded' };
      case 'failed':
        return { color: COLORS.failed, label: 'Failed' };
      default:
        return { color: COLORS.textLight, label: 'Unknown' };
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.babyBlue} />
        <ThemedText style={styles.loadingText}>Loading payment details...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error || !payment) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <ThemedText style={styles.errorText}>{error || 'Payment not found'}</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
  const statusInfo = getStatusInfo(payment.status);
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Payment Details',
          headerTitleStyle: {
            color: COLORS.darkNavy,
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
              <Ionicons name="arrow-back" size={24} color={COLORS.babyBlue} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, styles.amountCard]}>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Amount</ThemedText>
            <ThemedText style={styles.amountValue}>${payment.amount.toFixed(2)}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <ThemedText style={styles.statusText}>{statusInfo.label}</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Appointment Details</ThemedText>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person" size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Patient</ThemedText>
              <ThemedText style={styles.detailValue}>
                {getPatientName(payment.patient || payment.appointment?.patient)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Date</ThemedText>
              <ThemedText style={styles.detailValue}>
                {payment.appointment?.availability ? 
                  formatDate(combineDateTime(payment.appointment.availability.date, payment.appointment.availability.startTime)) : 
                  formatDate(payment.createdAt)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="medical" size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Service Type</ThemedText>
              <ThemedText style={styles.detailValue}>
                {payment.appointment?.caseDetails || 'Standard Consultation'}
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Payment Information</ThemedText>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={methodInfo.icon as any} size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Payment Method</ThemedText>
              <ThemedText style={styles.detailValue}>{methodInfo.label}</ThemedText>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="key" size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Transaction ID</ThemedText>
              <ThemedText style={styles.detailValue}>{payment.transactionId}</ThemedText>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={18} color={COLORS.babyBlue} />
            </View>
            <View style={styles.detailContent}>
              <ThemedText style={styles.detailLabel}>Payment Date</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(payment.paymentDate || payment.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.scrollPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backIcon: {
    paddingHorizontal: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.babyBlue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.darkNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  amountCard: {
    padding: 14,
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.babyBlue,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 8,
    lineHeight: 28,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(122, 167, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.darkNavy,
  },
  scrollPadding: {
    height: 80, // Add extra padding at the bottom
  },
}); 