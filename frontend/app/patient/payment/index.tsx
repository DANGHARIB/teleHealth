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
        
        // Charger les méthodes de paiement sauvegardées
        fetchSavedPaymentMethods();
      } catch (error) {
        console.error('Erreur lors du chargement du rendez-vous:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails du rendez-vous');
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
      const defaultMethod = methods.find(m => m.isDefault);
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
      let paymentData = {
        appointmentId: appointment._id,
        paymentMethod: selectedMethod,
        amount: appointment.price
      };
      
      // Si une méthode sauvegardée est sélectionnée, ajouter son ID
      if (selectedSavedMethod) {
        paymentData = {
          ...paymentData,
          savedPaymentMethodId: selectedSavedMethod
        };
      }
      
      // Appel à l'API pour créer le paiement
      await patientAPI.createPayment(paymentData);
      
      setProcessingPayment(false);
      Alert.alert(
        'Paiement réussi',
        'Votre paiement a été traité avec succès.',
        [{ text: 'OK', onPress: () => router.push('/(patient)/(tabs)/payments') }]
      );
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      setProcessingPayment(false);
      Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
    }
  };
  
  // Rendu des méthodes de paiement sauvegardées
  const renderSavedPaymentMethods = () => {
    if (loadingSavedMethods) {
      return (
        <ActivityIndicator size="small" color="#5586CC" style={styles.methodsLoader} />
      );
    }
    
    if (savedPaymentMethods.length === 0) {
      return (
        <View style={styles.noSavedMethodsContainer}>
          <ThemedText style={styles.noSavedMethodsText}>
            Vous n'avez pas encore de méthode de paiement sauvegardée
          </ThemedText>
          <TouchableOpacity 
            style={styles.addPaymentMethodButton}
            onPress={() => router.push('/patient/profile/add-payment-method')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#5586CC" />
            <ThemedText style={styles.addPaymentMethodText}>
              Ajouter une méthode de paiement
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.savedMethodsContainer}>
        <ThemedText style={styles.savedMethodsTitle}>
          Vos méthodes de paiement sauvegardées
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
                color={selectedSavedMethod === method._id ? '#FFFFFF' : '#0F2057'} 
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
                <ThemedText style={styles.defaultBadgeText}>Par défaut</ThemedText>
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
          <Ionicons name="add-circle-outline" size={18} color="#5586CC" />
          <ThemedText style={styles.addNewMethodText}>
            Utiliser une autre méthode de paiement
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
  
  // Rendu des méthodes de paiement standards (si pas de méthode sauvegardée sélectionnée)
  const renderPaymentMethods = () => {
    if (selectedSavedMethod) return null;
    
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
        
        {/* Afficher les méthodes de paiement sauvegardées */}
        {renderSavedPaymentMethods()}
        
        {/* Afficher les méthodes de paiement standards si aucune méthode sauvegardée n'est sélectionnée */}
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
  },
  // Styles pour les méthodes de paiement sauvegardées
  methodsLoader: {
    marginVertical: 20,
  },
  savedMethodsContainer: {
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
  savedMethodsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F2057',
    marginBottom: 12,
  },
  savedMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedSavedMethod: {
    backgroundColor: '#5586CC',
  },
  savedMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedMethodInfo: {
    flex: 1,
  },
  savedMethodDetails: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  selectedMethodDetails: {
    color: '#E2E8F0',
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
    color: '#22C55E',
    fontWeight: '500',
  },
  addNewMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
  },
  addNewMethodText: {
    fontSize: 14,
    color: '#5586CC',
    marginLeft: 8,
  },
  noSavedMethodsContainer: {
    backgroundColor: 'white',
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
    color: '#6C757D',
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
    color: '#5586CC',
    marginLeft: 8,
  },
}); 