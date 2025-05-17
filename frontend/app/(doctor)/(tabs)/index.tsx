import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';

// App theme colors
const COLORS = {
  primary: '#2D87BB',
  primaryDark: '#1A5F8C',
  navyBlue: '#0A2463',  // Navy blue for headings and important text
  darkNavy: '#090F47',  // Dark navy for headings and important information
  babyBlue: '#7AA7CC',  // Baby blue for secondary text and accents
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  text: '#333333',
  textLight: '#8F9BB3',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  pending: '#FFA500',
  refunded: '#FF9999',  // Light pastel red for refunds
  failed: '#DC3545',
  completed: '#7AA7CC',
};

// Types
type Payment = {
  _id: string;
  appointment: {
    _id: string;
    availability: {
      date: string;
      startTime: string;
    };
    patient: {
      first_name: string;
      last_name: string;
    };
  };
  patient: {
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

export default function DoctorFinancialsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Load payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await doctorAPI.getPayments();
        setPayments(data);
        
        // Calculate total earnings (only for 'completed' payments)
        const total = data
          .filter((payment: Payment) => payment.status === 'completed')
          .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
        
        setTotalEarnings(total);
        setLoading(false);
      } catch (err) {
        console.error('Error loading payments:', err);
        setError('Unable to load your payment history');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy', { locale: enUS });
    } catch (error) {
      return dateString;
    }
  };

  // Get patient's full name
  const getPatientName = (patient: any) => {
    if (!patient) return 'Unknown patient';
    return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  };

  // Render payment status
  const renderPaymentStatus = (status: string) => {
    let color = COLORS.completed;
    let label = 'Completed';

    switch (status) {
      case 'pending':
        color = COLORS.pending;
        label = 'Pending';
        break;
      case 'refunded':
        color = COLORS.refunded;
        label = 'Refunded';
        break;
      case 'failed':
        color = COLORS.failed;
        label = 'Failed';
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <ThemedText style={styles.statusText}>{label}</ThemedText>
      </View>
    );
  };

  // Render the payment method icon
  const renderPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <Ionicons name="card-outline" size={18} color={COLORS.textLight} />;
      case 'paypal':
        return <Ionicons name="logo-paypal" size={18} color={COLORS.textLight} />;
      case 'apple_pay':
        return <Ionicons name="logo-apple" size={18} color={COLORS.textLight} />;
      case 'google_pay':
        return <Ionicons name="logo-google" size={18} color={COLORS.textLight} />;
      default:
        return <Ionicons name="cash-outline" size={18} color={COLORS.textLight} />;
    }
  };

  // Render payment list
  const renderPayments = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.babyBlue} style={styles.loader} />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      );
    }

    if (!payments.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={60} color={COLORS.babyBlue} />
          <ThemedText style={styles.emptyText}>No payments received yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>Payments will appear here once processed</ThemedText>
        </View>
      );
    }

    return payments.map((payment) => (
      <TouchableOpacity 
        key={payment._id} 
        style={styles.paymentCard}
        onPress={() => router.push({
          pathname: '/doctor/payment/details',
          params: { paymentId: payment._id }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.patientSection}>
            <ThemedText style={styles.patientName}>
              {getPatientName(payment.patient || payment.appointment?.patient)}
            </ThemedText>
            <View style={styles.paymentDateContainer}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.babyBlue} style={styles.detailIcon} />
              <ThemedText style={styles.paymentDate}>
                {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.paymentIdContainer}>
              {renderPaymentMethodIcon(payment.paymentMethod)}
              <ThemedText style={styles.paymentId}>
                ID: {payment.transactionId.substring(0, 8)}...
              </ThemedText>
            </View>
          </View>
          <View style={styles.statusContainer}>
            {renderPaymentStatus(payment.status)}
            <ThemedText style={styles.paymentAmount}>
              ${payment.amount.toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Financials</ThemedText>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <ThemedText style={styles.summaryLabel}>Total Earnings</ThemedText>
          <ThemedText style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.summaryIconContainer}>
          <Ionicons name="wallet" size={32} color={COLORS.darkNavy} />
        </View>
      </View>
      
      <ThemedText style={styles.listTitle}>Payment History</ThemedText>
      
      <ScrollView 
        style={styles.paymentsContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPayments()}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: COLORS.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.babyBlue,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
  },
  summaryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(122, 167, 204, 0.1)', // Light baby blue with opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  paymentsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  scrollPadding: {
    height: 80, // Add extra padding at the bottom
  },
  paymentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientSection: {
    flex: 1,
    marginRight: 10,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  patientName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginBottom: 6,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkNavy,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  paymentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  paymentDate: {
    fontSize: 14,
    color: COLORS.babyBlue,
  },
  paymentId: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkNavy,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.babyBlue,
    textAlign: 'center',
  }
}); 