import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

// Type for payment methods
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

// Color constants
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
  darkBlue: '#090F47',
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

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Load payment methods whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
    }, [])
  );

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getSavedPaymentMethods();
      setPaymentMethods(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Unable to load your payment methods');
      setLoading(false);
    }
  };

  // Set a payment method as default
  const handleSetDefault = async (methodId: string) => {
    try {
      await patientAPI.setDefaultPaymentMethod(methodId);
      
      // Update local state
      setPaymentMethods(prevMethods => 
        prevMethods.map(method => ({
          ...method,
          isDefault: method._id === methodId
        }))
      );
      
      Alert.alert('Success', 'Payment method set as default');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Unable to set this method as default');
    }
  };

  // Delete a payment method
  const handleDelete = async (methodId: string) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await patientAPI.deletePaymentMethod(methodId);
              
              // Update local state
              setPaymentMethods(prevMethods => 
                prevMethods.filter(method => method._id !== methodId)
              );
              
              Alert.alert('Success', 'Payment method deleted');
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Unable to delete this payment method');
            }
          }
        }
      ]
    );
  };

  // Add a new payment method
  const goToAddPaymentMethod = () => {
    router.push('/patient/profile/add-payment-method');
  };

  // Get icons and names based on payment method type
  const getPaymentMethodDetails = (type: string) => {
    switch (type) {
      case 'card':
        return { icon: 'card-outline', label: 'Credit Card' };
      case 'paypal':
        return { icon: 'logo-paypal', label: 'PayPal' };
      case 'apple_pay':
        return { icon: 'logo-apple', label: 'Apple Pay' };
      case 'google_pay':
        return { icon: 'logo-google', label: 'Google Pay' };
      default:
        return { icon: 'card-outline', label: 'Payment Method' };
    }
  };

  // Render a payment method
  const renderPaymentMethod = (method: PaymentMethod) => {
    const { icon, label } = getPaymentMethodDetails(method.type);
    
    return (
      <View key={method._id} style={styles.paymentMethodItem}>
        <View style={styles.paymentMethodHeader}>
          <View style={styles.paymentMethodIconContainer}>
            <Ionicons name={icon as any} size={24} color={COLORS.white} />
          </View>
          
          <View style={styles.paymentMethodInfo}>
            <ThemedText style={styles.paymentMethodName}>{method.name}</ThemedText>
            <ThemedText style={styles.paymentMethodDetails}>
              {method.type === 'card' 
                ? `${label} •••• ${method.lastFourDigits} | Exp: ${method.expiryMonth}/${method.expiryYear}`
                : label
              }
            </ThemedText>
          </View>
          
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <ThemedText style={styles.defaultBadgeText}>Default</ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.paymentMethodActions}>
          {!method.isDefault && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSetDefault(method._id)}
            >
              <Ionicons name="star-outline" size={18} color={COLORS.primary} />
              <ThemedText style={styles.actionButtonText}>Set as default</ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(method._id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <ThemedText style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Payment Methods',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0F2057" />
            </TouchableOpacity>
          )
        }}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Your Payment Methods</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Manage your payment options for faster bookings
              </ThemedText>
            </View>
            
            {paymentMethods.length > 0 ? (
              <View style={styles.paymentMethodsList}>
                {paymentMethods.map(renderPaymentMethod)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={64} color={COLORS.gray400} />
                <ThemedText style={styles.emptyStateText}>
                  You don&apos;t have any saved payment methods yet
                </ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={goToAddPaymentMethod}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
              <ThemedText style={styles.addButtonText}>
                Add Payment Method
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loader: {
    marginTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  paymentMethodsList: {
    marginBottom: 24,
  },
  paymentMethodItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  defaultBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.danger + '10',
  },
  deleteButtonText: {
    color: COLORS.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 