import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

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
  status: 'pending' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  caseDetails: string;
  sessionLink?: string;
  paymentStatus: 'pending' | 'completed' | 'refunded';
  price: number;
};

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  
  // Charger les détails du rendez-vous
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        
        if (!appointmentId) {
          Alert.alert('Erreur', 'ID de rendez-vous manquant');
          router.back();
          return;
        }
        
        const appointments = await patientAPI.getAppointments();
        const foundAppointment = appointments.find((app: Appointment) => app._id === appointmentId);
        
        if (!foundAppointment) {
          Alert.alert('Erreur', 'Rendez-vous non trouvé');
          router.back();
          return;
        }
        
        setAppointment(foundAppointment);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement du rendez-vous:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails du rendez-vous');
        setLoading(false);
        router.back();
      }
    };
    
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  // Traiter le paiement
  const processPayment = async () => {
    if (!appointment) return;
    
    setProcessingPayment(true);
    
    try {
      // Simuler un délai de traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Appel à l'API pour créer le paiement
      await patientAPI.createPayment({
        appointmentId: appointment._id,
        paymentMethod: selectedMethod,
        amount: appointment.price
      });
      
      setProcessingPayment(false);
      Alert.alert(
        'Paiement réussi',
        'Votre paiement a été traité avec succès.',
        [{ text: 'OK', onPress: () => router.push('/patient/appointment') }]
      );
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      setProcessingPayment(false);
      Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
    }
  };
  
  // Rendu des méthodes de paiement
  const renderPaymentMethods = () => {
    const methods = [
      { id: 'card', icon: 'card-outline', label: 'Carte bancaire' },
      { id: 'paypal', icon: 'logo-paypal', label: 'PayPal' },
      { id: 'apple_pay', icon: 'logo-apple', label: 'Apple Pay' },
      { id: 'google_pay', icon: 'logo-google', label: 'Google Pay' }
    ];
    
    return (
      <View style={styles.paymentMethods}>
        {methods.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethodItem,
              selectedMethod === method.id && styles.selectedPaymentMethod
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.paymentMethodIcon}>
              <Ionicons 
                name={method.icon as any} 
                size={24} 
                color={selectedMethod === method.id ? '#FFFFFF' : '#0F2057'} 
              />
            </View>
            <ThemedText style={selectedMethod === method.id ? styles.selectedMethodText : styles.methodText}>
              {method.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5586CC" />
        <ThemedText style={styles.loadingText}>Chargement des détails...</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Paiement',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0F2057" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.appointmentCard}>
          <ThemedText style={styles.cardTitle}>Détails du rendez-vous</ThemedText>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Médecin:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.doctor?.full_name || 'Dr. Nom du médecin'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.availability?.date || 'Date non disponible'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Heure:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.availability?.startTime || '00:00'}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Type:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {appointment?.caseDetails || 'Consultation standard'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.paymentSummary}>
          <ThemedText style={styles.paymentTitle}>Récapitulatif du paiement</ThemedText>
          
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Prix de la consultation:</ThemedText>
            <ThemedText style={styles.priceValue}>{appointment?.price || 28} €</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.methodsTitle}>Méthode de paiement</ThemedText>
        {renderPaymentMethods()}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payButton}
          onPress={processPayment}
          disabled={processingPayment}
        >
          {processingPayment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.payButtonText}>
              Payer {appointment?.price || 28} €
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
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
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
    color: '#0F2057',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F2057',
  },
  paymentSummary: {
    backgroundColor: 'white',
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
    color: '#0F2057',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F2057',
  },
  methodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2057',
    marginTop: 16,
    marginBottom: 16,
  },
  paymentMethods: {
    backgroundColor: 'white',
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
    borderBottomColor: '#E5E5E5',
  },
  selectedPaymentMethod: {
    backgroundColor: '#5586CC',
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
    color: '#0F2057',
  },
  selectedMethodText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  payButton: {
    backgroundColor: '#5586CC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  }
}); 