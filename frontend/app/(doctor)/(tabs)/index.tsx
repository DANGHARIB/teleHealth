import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';

// App theme colors
const COLORS = {
  primary: '#0F2057',
  primaryLight: '#5586CC',
  secondary: '#4CAF50',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  error: '#DC3545',
  text: {
    primary: '#0F2057',
    secondary: '#6C757D',
    light: '#A0A0A0',
    white: '#FFFFFF'
  },
  border: '#E5E9F2',
  warning: '#FFA500',
  status: {
    completed: '#5586CC',
    refund: '#4CAF50',
    pending: '#FFA500',
    failed: '#DC3545'
  }
};

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
  // Add these for consistency with patient interface
  isRefund?: boolean;
  displayAmount?: number;
  refundDetails?: Payment;
  isCombined?: boolean;
};

export default function DoctorFinancialsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Load payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await doctorAPI.getPayments();
        
        // Process data to mark refunds
        const processedPayments = data.map((payment: Payment) => {
          const isRefund = payment.status === 'refunded';
          return {
            ...payment,
            isRefund,
            displayAmount: Math.abs(payment.amount)
          };
        });
        
        // Grouper les remboursements avec leurs paiements originaux
        const groupedPayments = groupRefundsWithOriginals(processedPayments);
        
        setPayments(groupedPayments);
        setLoading(false);
      } catch (err) {
        console.error('Error loading payments:', err);
        setError('Unable to load your payment history');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments
  const getFilteredPayments = () => {
    if (!activeFilter) return payments;
    
    return payments.filter(payment => {
      if (activeFilter === 'refunds') {
        return payment.isRefund || payment.status === 'refunded';
      }
      if (activeFilter === 'payments') {
        return !payment.isRefund && payment.status === 'completed';
      }
      if (activeFilter === 'monthly') {
        // Filter by current month
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        const currentDate = new Date();
        return paymentDate.getMonth() === currentDate.getMonth() && 
               paymentDate.getFullYear() === currentDate.getFullYear();
      }
      return true;
    });
  };

  // Group refunds with originals
  const groupRefundsWithOriginals = (payments: Payment[]) => {
    // Create a map to track refunds by appointment ID
    const refundMap: Record<string, Payment> = {};
    const refundIds: Set<string> = new Set();
    
    // First pass: identify all refunds
    payments.forEach(payment => {
      if (payment.isRefund && payment.appointment?._id) {
        refundMap[payment.appointment._id] = payment;
        refundIds.add(payment._id);
      }
    });
    
    // Second pass: combine refunds with original payments
    const combinedPayments = payments
      .filter(payment => !refundIds.has(payment._id)) // Filter out refunds that have been combined
      .map(payment => {
        if (!payment.isRefund && payment.status === 'refunded' && payment.appointment?._id) {
          // If this is an original payment that has been refunded
          const refund = refundMap[payment.appointment._id];
          if (refund) {
            return {
              ...payment,
              refundDetails: refund,
              // Mark as a combined payment
              isCombined: true
            };
          }
        }
        return payment;
      });
    
    return combinedPayments;
  };

  // Calculate monthly summary
  const getMonthlyTotal = () => {
    const currentDate = new Date();
    let totalEarned = 0;
    let totalRefunded = 0;
    let totalPenalties = 0;
    let paymentCount = 0;
    let refundCount = 0;

    payments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      if (paymentDate.getMonth() === currentDate.getMonth() && 
          paymentDate.getFullYear() === currentDate.getFullYear()) {
        
        // If this is a payment that has a refundDetails (original payment refunded)
        if (payment.refundDetails) {
          // The original amount is counted in earnings
          totalEarned += payment.amount;
          paymentCount++;
          
          // The refund amount is deducted from total earnings
          const refundAmount = Math.abs(payment.refundDetails.amount);
          totalRefunded += refundAmount;
          
          // Calculate penalty (difference between original amount and refund)
          // For the doctor, this is a revenue retained
          const penaltyAmount = payment.amount - refundAmount;
          totalPenalties += penaltyAmount;
          
          refundCount++;
        }
        // If this is a direct refund (not an original payment)
        else if (payment.isRefund || payment.amount < 0) {
          // We ignore direct refunds as they are already
          // accounted for via refundDetails of the original payment
        } 
        // If this is a normal payment
        else if (payment.status === 'completed') {
          totalEarned += payment.amount;
          paymentCount++;
        }
      }
    });

    // Net amount is calculated as earnings minus refunds
    // Note: penalties are already included in totalEarned - totalRefunded
    const netAmount = totalEarned - totalRefunded;

    return {
      totalEarned,
      totalRefunded,
      totalPenalties,
      netAmount,
      paymentCount,
      refundCount,
      monthName: format(currentDate, 'MMMM yyyy', { locale: enUS })
    };
  };

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

  // Render payment method
  const renderPaymentMethod = (method: string) => {
    let icon: any = 'card-outline';
    let label = 'Credit Card';
    let color = COLORS.text.secondary;

    switch (method) {
      case 'paypal':
        icon = 'logo-paypal';
        label = 'PayPal';
        color = '#0070BA';
        break;
      case 'apple_pay':
        icon = 'logo-apple';
        label = 'Apple Pay';
        color = '#000000';
        break;
      case 'google_pay':
        icon = 'logo-google';
        label = 'Google Pay';
        color = '#4285F4';
        break;
    }

    return (
      <View style={styles.methodContainer}>
        <Ionicons name={icon} size={16} color={color} />
        <ThemedText style={[styles.methodText, { color }]}>{label}</ThemedText>
      </View>
    );
  };

  // Render payment status
  const renderPaymentStatus = (status: string, isRefund: boolean) => {
    let color = COLORS.status.completed;
    let icon: any = 'checkmark-circle';
    let label = 'Completed';

    if (isRefund) {
      color = COLORS.status.refund;
      icon = 'arrow-undo-outline';
      label = 'Refund';
    } else {
      switch (status) {
        case 'pending':
          color = COLORS.status.pending;
          icon = 'time-outline';
          label = 'Pending';
          break;
        case 'refunded':
          color = COLORS.status.refund;
          icon = 'return-down-back-outline';
          label = 'Refunded';
          break;
        case 'failed':
          color = COLORS.status.failed;
          icon = 'close-circle-outline';
          label = 'Failed';
          break;
      }
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Ionicons name={icon} size={12} color="white" style={styles.statusIcon} />
        <ThemedText style={styles.statusText}>{label}</ThemedText>
      </View>
    );
  };

  // Render filters
  const renderFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === null ? styles.activeFilter : null]}
          onPress={() => setActiveFilter(null)}
        >
          <ThemedText style={[styles.filterText, activeFilter === null ? styles.activeFilterText : null]}>
            All
          </ThemedText>
          {activeFilter === null && <View style={styles.filterActiveIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'payments' ? styles.activeFilter : null]}
          onPress={() => setActiveFilter('payments')}
        >
          <ThemedText style={[styles.filterText, activeFilter === 'payments' ? styles.activeFilterText : null]}>
            Payments
          </ThemedText>
          {activeFilter === 'payments' && <View style={styles.filterActiveIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'refunds' ? styles.activeFilter : null]}
          onPress={() => setActiveFilter('refunds')}
        >
          <ThemedText style={[styles.filterText, activeFilter === 'refunds' ? styles.activeFilterText : null]}>
            Refunds
          </ThemedText>
          {activeFilter === 'refunds' && <View style={styles.filterActiveIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'monthly' ? styles.activeFilter : null]}
          onPress={() => setActiveFilter('monthly')}
        >
          <ThemedText style={[styles.filterText, activeFilter === 'monthly' ? styles.activeFilterText : null]}>
            Monthly
          </ThemedText>
          {activeFilter === 'monthly' && <View style={styles.filterActiveIndicator} />}
        </TouchableOpacity>
      </View>
    );
  };

  // Render monthly summary
  const renderMonthlySummary = () => {
    const monthlyData = getMonthlyTotal();
    
    return (
      <View style={styles.monthlySummaryContainer}>
        <View style={styles.monthlyHeader}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
          <ThemedText style={styles.monthlyTitle}>{monthlyData.monthName}</ThemedText>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Earned</ThemedText>
              <ThemedText style={styles.summaryAmount}>{monthlyData.totalEarned.toFixed(2)} €</ThemedText>
              <ThemedText style={styles.summaryCount}>{monthlyData.paymentCount} payments</ThemedText>
            </View>
          </View>
          
          {monthlyData.totalRefunded > 0 && (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Total Refunded (80%)</ThemedText>
                  <ThemedText style={styles.refundSummaryAmount}>- {monthlyData.totalRefunded.toFixed(2)} €</ThemedText>
                  <ThemedText style={styles.summaryCount}>{monthlyData.refundCount} refunds</ThemedText>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Penalties Kept (20%)</ThemedText>
                  <ThemedText style={styles.penaltySummaryAmount}>{monthlyData.totalPenalties.toFixed(2)} €</ThemedText>
                  <ThemedText style={styles.summaryCount}>{monthlyData.refundCount} cancellations</ThemedText>
                </View>
              </View>
            </>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.totalLabel}>Net Income</ThemedText>
              <ThemedText style={styles.totalAmount}>{monthlyData.netAmount.toFixed(2)} €</ThemedText>
            </View>
          </View>
        </View>
        
        {monthlyData.paymentCount === 0 && (
          <View style={styles.emptyMonthly}>
            <Ionicons name="calendar-clear-outline" size={40} color={COLORS.text.light} />
            <ThemedText style={styles.emptyMonthlyText}>No transactions this month</ThemedText>
          </View>
        )}
      </View>
    );
  };

  // Render a standard payment
  const renderPayment = (payment: any, index: number) => {
    return (
      <View key={payment._id} style={[styles.paymentCard, { marginTop: index > 0 ? 16 : 0 }]}>
        <TouchableOpacity  
          style={styles.paymentCardInner}
          activeOpacity={0.7}
          onPress={() => router.push({
            pathname: '/doctor/payment/details',
            params: { paymentId: payment._id }
          })}
        >
          <View style={styles.paymentHeader}>
            <ThemedText style={styles.paymentPatient}>
              {getPatientName(payment.patient || payment.appointment?.patient)}
            </ThemedText>
            {renderPaymentStatus(payment.status, payment.isRefund)}
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <ThemedText style={styles.paymentDate}>
                {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
              </ThemedText>
            </View>
            {renderPaymentMethod(payment.paymentMethod)}
          </View>

          <View style={styles.paymentFooter}>
            <View style={styles.transactionIdContainer}>
              <Ionicons name="key-outline" size={12} color={COLORS.text.light} />
              <ThemedText style={styles.transactionId}>
                {payment.transactionId.substring(0, 8)}...
              </ThemedText>
            </View>
            <ThemedText style={[
              styles.paymentAmount, 
              payment.isRefund ? styles.refundAmount : null
            ]}>
              {payment.isRefund ? '- ' : ''}{payment.displayAmount || payment.amount} €
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render combined refund payment
  const renderCombinedRefundPayment = (payment: any, index: number) => {
    // Calculate amounts for partial refund
    const originalAmount = payment.amount;
    const penaltyAmount = originalAmount * 0.2; // 20% penalty retained by the doctor
    const refundAmount = originalAmount * 0.8; // 80% refunded to the patient

    return (
      <View key={payment._id} style={[styles.refundCard, { marginTop: index > 0 ? 16 : 0 }]}>
        <TouchableOpacity 
          style={styles.paymentCardInner}
          activeOpacity={0.7}
          onPress={() => router.push({
            pathname: '/doctor/payment/details',
            params: { paymentId: payment._id }
          })}
        >
          <View style={styles.refundHeader}>
            <View style={styles.refundHeaderLeft}>
              <ThemedText style={styles.paymentPatient}>
                {getPatientName(payment.patient || payment.appointment?.patient)}
              </ThemedText>
            </View>
            {renderPaymentStatus('refunded', false)}
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <ThemedText style={styles.paymentDate}>
                {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
              </ThemedText>
            </View>
            {renderPaymentMethod(payment.paymentMethod)}
          </View>

          <View style={styles.refundDetailsContainer}>
            <View style={styles.refundDetailRow}>
              <ThemedText style={styles.refundDetailLabel}>Original Amount</ThemedText>
              <ThemedText style={styles.refundDetailValue}>{originalAmount.toFixed(2)} €</ThemedText>
            </View>
            
            <View style={styles.refundDetailRow}>
              <View style={styles.penaltyLabelContainer}>
                <ThemedText style={styles.refundDetailLabel}>Penalty Kept (20%)</ThemedText>
                <TouchableOpacity style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.penaltyValue}>{penaltyAmount.toFixed(2)} €</ThemedText>
            </View>
            
            <View style={[styles.refundDetailRow, styles.refundTotalRow]}>
              <ThemedText style={styles.refundTotalLabel}>Refunded to Patient (80%)</ThemedText>
              <ThemedText style={styles.refundTotalValue}>- {refundAmount.toFixed(2)} €</ThemedText>
            </View>
          </View>

          <View style={styles.paymentFooter}>
            <View style={styles.transactionIdContainer}>
              <Ionicons name="key-outline" size={12} color={COLORS.text.light} />
              <ThemedText style={styles.transactionId}>
                {payment.transactionId.substring(0, 8)}...
              </ThemedText>
            </View>
            <ThemedText style={styles.penaltyAmount}>
              + {penaltyAmount.toFixed(2)} €
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render payment list
  const renderPayments = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={styles.loader} />
          <ThemedText style={styles.loaderText}>Loading your transactions...</ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      );
    }

    // Show monthly summary if monthly filter is active
    if (activeFilter === 'monthly') {
      return renderMonthlySummary();
    }

    const filteredPayments = getFilteredPayments();
    
    if (!filteredPayments.length) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={50} color={COLORS.primaryLight} />
          </View>
          <ThemedText style={styles.emptyText}>
            {activeFilter === 'refunds' 
              ? 'No refunds found' 
              : 'No payments received yet'}
          </ThemedText>
        </View>
      );
    }

    return filteredPayments.map((payment, index) => {
      // Check if this is a payment that has been refunded
      if (payment.status === 'refunded' || payment.isCombined) {
        return renderCombinedRefundPayment(payment, index);
      } else {
        return renderPayment(payment, index);
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ 
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background }
        }} />
        
        <View style={styles.header}>
          <ThemedText style={styles.title}>Finances</ThemedText>
          <ThemedText style={styles.subtitle}>Your earning history</ThemedText>
        </View>
        
        {renderFilters()}
        
        <ScrollView 
          style={styles.paymentsContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderPayments()}
        </ScrollView>
        
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  headerBackButton: {
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  title: {
    fontSize: width < 375 ? 28 : 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: width < 375 ? 34 : 38,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '400',
    lineHeight: 22,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  activeFilter: {
    backgroundColor: 'rgba(85, 134, 204, 0.1)',
  },
  filterText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterActiveIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 20,
    height: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 2,
  },
  paymentsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  paymentCardInner: {
    padding: 18,
    borderRadius: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentPatient: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 247, 252, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 5,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  transactionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionId: {
    fontSize: 12,
    color: COLORS.text.light,
    marginLeft: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  loaderContainer: {
    flex: 1,
    marginTop: 60,
    alignItems: 'center',
  },
  loader: {
    marginBottom: 10,
  },
  loaderText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(85, 134, 204, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  monthlySummaryContainer: {
    paddingTop: 20,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  monthlyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  summaryRow: {
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  refundSummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyMonthly: {
    alignItems: 'center',
    marginTop: 30,
  },
  emptyMonthlyText: {
    fontSize: 16,
    color: COLORS.text.light,
    marginTop: 10,
  },
  refundCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginLeft: 6,
  },
  refundDetailsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
  },
  refundDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refundDetailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  refundDetailValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  penaltyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    marginLeft: 5,
  },
  penaltyValue: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  refundTotalRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  refundTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  refundTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },
  penaltyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  penaltySummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 2,
  },
}); 