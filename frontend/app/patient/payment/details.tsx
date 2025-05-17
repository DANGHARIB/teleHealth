import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

// Type pour le paiement
type Payment = {
  _id: string;
  appointment: {
    _id: string;
    availability: {
      date: string;
      startTime: string;
      endTime: string;
    };
    doctor: {
      _id: string;
      first_name?: string;
      last_name?: string;
      full_name?: string;
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
  
  // Charger les détails du paiement
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        
        if (!paymentId) {
          Alert.alert('Erreur', 'ID de paiement manquant');
          router.back();
          return;
        }
        
        const data = await patientAPI.getPaymentById(paymentId);
        setPayment(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement du paiement:', error);
        setError('Impossible de charger les détails du paiement');
        setLoading(false);
      }
    };
    
    fetchPaymentDetails();
  }, [paymentId]);
  
  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  // Rendu du moyen de paiement
  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'card':
        return { icon: 'card-outline', label: 'Carte bancaire' };
      case 'paypal':
        return { icon: 'logo-paypal', label: 'PayPal' };
      case 'apple_pay':
        return { icon: 'logo-apple', label: 'Apple Pay' };
      case 'google_pay':
        return { icon: 'logo-google', label: 'Google Pay' };
      default:
        return { icon: 'card-outline', label: 'Moyen inconnu' };
    }
  };
  
  // Rendu du statut de paiement
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: '#FFA500', label: 'En attente' };
      case 'completed':
        return { color: '#5586CC', label: 'Complété' };
      case 'refunded':
        return { color: '#4CAF50', label: 'Remboursé' };
      case 'failed':
        return { color: '#DC3545', label: 'Échoué' };
      default:
        return { color: '#6C757D', label: 'Inconnu' };
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5586CC" />
        <ThemedText style={styles.loadingText}>Chargement des détails...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error || !payment) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#DC3545" />
        <ThemedText style={styles.errorText}>{error || 'Paiement non trouvé'}</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Retour</ThemedText>
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
          title: 'Détails du paiement',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0F2057" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Montant</ThemedText>
            <ThemedText style={styles.amountValue}>{payment.amount} €</ThemedText>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <ThemedText style={styles.statusText}>{statusInfo.label}</ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Détails du rendez-vous</ThemedText>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Médecin</ThemedText>
            <ThemedText style={styles.detailValue}>
              {payment.appointment?.doctor?.full_name || 'Non spécifié'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date</ThemedText>
            <ThemedText style={styles.detailValue}>
              {formatDate(payment.appointment?.availability?.date || payment.createdAt)}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Type</ThemedText>
            <ThemedText style={styles.detailValue}>
              {payment.appointment?.caseDetails || 'Consultation standard'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Informations de paiement</ThemedText>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Méthode</ThemedText>
            <View style={styles.methodContainer}>
              <Ionicons name={methodInfo.icon as any} size={16} color="#6C757D" />
              <ThemedText style={styles.methodText}>{methodInfo.label}</ThemedText>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>ID Transaction</ThemedText>
            <ThemedText style={styles.detailValue}>{payment.transactionId}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date de paiement</ThemedText>
            <ThemedText style={styles.detailValue}>
              {formatDate(payment.paymentDate || payment.createdAt)}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#5586CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F2057',
    flex: 1,
    textAlign: 'right',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 14,
    color: '#0F2057',
    marginLeft: 4,
    fontWeight: '500',
  },
}); 