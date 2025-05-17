import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
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
};

export default function PaymentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger les paiements
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await patientAPI.getPayments();
        setPayments(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des paiements:', err);
        setError('Impossible de charger votre historique de paiements');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

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
    let icon = 'card-outline';
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
        <Ionicons name={icon as any} size={16} color="#6C757D" />
        <ThemedText style={styles.methodText}>{label}</ThemedText>
      </View>
    );
  };

  // Rendu pour le statut de paiement
  const renderPaymentStatus = (status: string) => {
    let color = '#5586CC';
    let label = 'Complété';

    switch (status) {
      case 'pending':
        color = '#FFA500';
        label = 'En attente';
        break;
      case 'refunded':
        color = '#4CAF50';
        label = 'Remboursé';
        break;
      case 'failed':
        color = '#DC3545';
        label = 'Échoué';
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <ThemedText style={styles.statusText}>{label}</ThemedText>
      </View>
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

    if (!payments.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={50} color="#B5CDEC" />
          <ThemedText style={styles.emptyText}>Aucun paiement effectué</ThemedText>
        </View>
      );
    }

    return payments.map((payment) => (
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
          {renderPaymentStatus(payment.status)}
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
          <ThemedText style={styles.paymentAmount}>
            {payment.amount} €
          </ThemedText>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <ThemedText style={styles.title}>Paiements</ThemedText>
        <ThemedText style={styles.subtitle}>Historique de vos paiements</ThemedText>
      </View>
      
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentDoctor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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