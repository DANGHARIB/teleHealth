import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

// Types
type Payment = {
  _id: string;
  appointment: {
    _id: string;
    availability: {
      date: string;
      startTime: string;
    };
    doctor: {
      full_name: string;
    };
  };
  amount: number;
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transactionId: string;
  paymentDate: string;
  createdAt: string;
  // Ajout d'un champ pour indiquer si c'est un remboursement
  isRefund?: boolean;
};

const { width } = Dimensions.get('window');

export default function PaymentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Charger les paiements
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await patientAPI.getPayments();
        
        // Organiser les données pour identifier les remboursements
        const processedPayments = data.map((payment: Payment) => {
          // Détecter un remboursement par le montant négatif
          const isRefund = payment.amount < 0;
          return {
            ...payment,
            isRefund,
            // Utiliser la valeur absolue pour l'affichage
            displayAmount: Math.abs(payment.amount)
          };
        });
        
        setPayments(processedPayments);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des paiements:', err);
        setError('Impossible de charger votre historique de paiements');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filtrer les paiements
  const getFilteredPayments = () => {
    if (!activeFilter) return payments;
    
    return payments.filter(payment => {
      if (activeFilter === 'refunds') {
        return payment.isRefund || payment.status === 'refunded';
      }
      if (activeFilter === 'payments') {
        return !payment.isRefund && payment.status !== 'refunded';
      }
      return true;
    });
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Rendu pour un moyen de paiement
  const renderPaymentMethod = (method: string) => {
    let icon: any = 'card-outline';
    let label = 'Carte bancaire';

    switch (method) {
      case 'paypal':
        icon = 'logo-paypal';
        label = 'PayPal';
        break;
      case 'apple_pay':
        icon = 'logo-apple';
        label = 'Apple Pay';
        break;
      case 'google_pay':
        icon = 'logo-google';
        label = 'Google Pay';
        break;
    }

    return (
      <View style={styles.methodContainer}>
        <Ionicons name={icon} size={16} color="#6C757D" />
        <ThemedText style={styles.methodText}>{label}</ThemedText>
      </View>
    );
  };

  // Rendu pour le statut de paiement
  const renderPaymentStatus = (status: string, isRefund: boolean) => {
    let color = '#5586CC';
    let icon: any = 'checkmark-circle';
    let label = 'Complété';

    if (isRefund) {
      color = '#4CAF50';
      icon = 'arrow-undo-outline';
      label = 'Remboursement';
    } else {
      switch (status) {
        case 'pending':
          color = '#FFA500';
          icon = 'time-outline';
          label = 'En attente';
          break;
        case 'refunded':
          color = '#4CAF50';
          icon = 'return-down-back-outline';
          label = 'Remboursé';
          break;
        case 'failed':
          color = '#DC3545';
          icon = 'close-circle-outline';
          label = 'Échoué';
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

  // Rendu des filtres 
  const renderFilters = () => {
    return (
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === null ? styles.activeFilter : null]}
          onPress={() => setActiveFilter(null)}
        >
          <ThemedText style={[styles.filterText, activeFilter === null ? styles.activeFilterText : null]}>
            Tous
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'payments' ? styles.activeFilter : null]}
          onPress={() => setActiveFilter('payments')}
        >
          <ThemedText style={[styles.filterText, activeFilter === 'payments' ? styles.activeFilterText : null]}>
            Paiements
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'refunds' ? styles.activeFilter : null]}
          onPress={() => setActiveFilter('refunds')}
        >
          <ThemedText style={[styles.filterText, activeFilter === 'refunds' ? styles.activeFilterText : null]}>
            Remboursements
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu pour un paiement normal
  const renderPayment = (payment: any) => {
    return (
      <TouchableOpacity 
        key={payment._id} 
        style={styles.paymentCard}
        onPress={() => router.push({
          pathname: '/patient/payment/details',
          params: { paymentId: payment._id }
        })}
      >
        <View style={styles.paymentHeader}>
          <ThemedText style={styles.paymentDoctor}>
            {payment.appointment?.doctor?.full_name || 'Docteur'}
          </ThemedText>
          {renderPaymentStatus(payment.status, payment.isRefund)}
        </View>

        <View style={styles.paymentDetails}>
          <ThemedText style={styles.paymentDate}>
            {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
          </ThemedText>
          {renderPaymentMethod(payment.paymentMethod)}
        </View>

        <View style={styles.paymentFooter}>
          <ThemedText style={styles.transactionId}>
            ID: {payment.transactionId.substring(0, 8)}...
          </ThemedText>
          <ThemedText style={[
            styles.paymentAmount, 
            payment.isRefund ? styles.refundAmount : null
          ]}>
            {payment.isRefund ? '- ' : ''}{payment.displayAmount || Math.abs(payment.amount)} €
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu pour un remboursement partiel (avec pénalité)
  const renderPartialRefund = (payment: any) => {
    // Calculer les montants pour le remboursement partiel
    const originalAmount = Math.abs(payment.amount) * 1.25; // 100% = 80% * 1.25
    const penaltyAmount = originalAmount * 0.2; // 20% du montant original
    const refundAmount = Math.abs(payment.amount); // 80% du montant original

    return (
      <TouchableOpacity 
        key={payment._id} 
        style={styles.refundCard}
        onPress={() => router.push({
          pathname: '/patient/payment/details',
          params: { paymentId: payment._id }
        })}
      >
        <View style={styles.refundHeader}>
          <View style={styles.refundHeaderLeft}>
            <Ionicons name="arrow-undo-outline" size={16} color="#4CAF50" />
            <ThemedText style={styles.refundTitle}>Remboursement</ThemedText>
          </View>
          {renderPaymentStatus('refunded', true)}
        </View>

        <View style={styles.paymentDetails}>
          <View>
            <ThemedText style={styles.paymentDoctor}>
              {payment.appointment?.doctor?.full_name || 'Docteur'}
            </ThemedText>
            <ThemedText style={styles.paymentDate}>
              {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
            </ThemedText>
          </View>
          {renderPaymentMethod(payment.paymentMethod)}
        </View>

        <View style={styles.refundDetailsContainer}>
          <View style={styles.refundDetailRow}>
            <ThemedText style={styles.refundDetailLabel}>Montant initial</ThemedText>
            <ThemedText style={styles.refundDetailValue}>{originalAmount.toFixed(2)} €</ThemedText>
          </View>
          
          <View style={styles.refundDetailRow}>
            <View style={styles.penaltyLabelContainer}>
              <ThemedText style={styles.refundDetailLabel}>Pénalité (20%)</ThemedText>
              <TouchableOpacity>
                <Ionicons name="information-circle-outline" size={16} color="#6C757D" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.penaltyValue}>- {penaltyAmount.toFixed(2)} €</ThemedText>
          </View>
          
          <View style={[styles.refundDetailRow, styles.refundTotalRow]}>
            <ThemedText style={styles.refundTotalLabel}>Remboursement (80%)</ThemedText>
            <ThemedText style={styles.refundTotalValue}>{refundAmount.toFixed(2)} €</ThemedText>
          </View>
        </View>

        <View style={styles.paymentFooter}>
          <ThemedText style={styles.transactionId}>
            ID: {payment.transactionId.substring(0, 8)}...
          </ThemedText>
          <ThemedText style={styles.refundAmount}>
            {refundAmount.toFixed(2)} €
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu pour la liste des paiements
  const renderPayments = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#5586cc" style={styles.loader} />;
    }

    if (error) {
      return <ThemedText style={styles.errorText}>{error}</ThemedText>;
    }

    const filteredPayments = getFilteredPayments();
    
    if (!filteredPayments.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={50} color="#B5CDEC" />
          <ThemedText style={styles.emptyText}>
            {activeFilter === 'refunds' 
              ? 'Aucun remboursement trouvé' 
              : 'Aucun paiement effectué'}
          </ThemedText>
        </View>
      );
    }

    return filteredPayments.map((payment) => {
      // Déterminer s'il s'agit d'un remboursement partiel
      if (payment.isRefund && payment.status === 'refunded') {
        return renderPartialRefund(payment);
      } else {
        return renderPayment(payment);
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <ThemedText style={styles.title}>Finances</ThemedText>
        <ThemedText style={styles.subtitle}>Historique de vos transactions</ThemedText>
      </View>
      
      {renderFilters()}
      
      <ScrollView style={styles.paymentsContainer} showsVerticalScrollIndicator={false}>
        {renderPayments()}
      </ScrollView>
      
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/patient/(tabs)/finances')}>
          <Ionicons name="wallet-outline" size={24} color="#0F2057" />
          <ThemedText style={[styles.navText, styles.activeNavText]}>Finances</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/patient/(tabs)')}>
          <Ionicons name="search-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Recherche</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/patient/(tabs)/appointment')}>
          <Ionicons name="calendar-outline" size={24} color="#6C757D" />
          <ThemedText style={styles.navText}>Rendez-vous</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/patient/(tabs)/profile')}>
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
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F6F9FF',
    borderRadius: 12,
    padding: 6,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: '#6C757D',
  },
  activeFilterText: {
    color: '#0F2057',
    fontWeight: 'bold',
  },
  paymentsContainer: {
    flex: 1,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refundCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  paymentDoctor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  refundDetailsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  refundDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refundDetailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  refundDetailValue: {
    fontSize: 14,
    color: '#0F2057',
  },
  penaltyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyValue: {
    fontSize: 14,
    color: '#DC3545',
  },
  refundTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginBottom: 0,
  },
  refundTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  refundTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  transactionId: {
    fontSize: 12,
    color: '#6C757D',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    marginTop: 10,
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