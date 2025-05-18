import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { patientAPI } from '@/services/api';

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

// Available payment method types
const paymentTypes = [
  { id: 'card', name: 'Credit Card', icon: 'card-outline' },
  { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
  { id: 'apple_pay', name: 'Apple Pay', icon: 'logo-apple' },
  { id: 'google_pay', name: 'Google Pay', icon: 'logo-google' }
];

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('card');
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Common field
  const [name, setName] = useState('');
  
  // For credit cards
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState('');

  // For PayPal
  const [paypalEmail, setPaypalEmail] = useState('');

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Determine card type based on first digit
  const detectCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s+/g, '');
    
    if (/^4/.test(number)) {
      return 'Visa';
    } else if (/^5[1-5]/.test(number)) {
      return 'Mastercard';
    } else if (/^3[47]/.test(number)) {
      return 'American Express';
    } else if (/^(6011|65|64[4-9])/.test(number)) {
      return 'Discover';
    } else {
      return '';
    }
  };

  // Handle card number change
  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    setCardType(detectCardType(formatted));
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Reset form fields when payment type changes
  useEffect(() => {
    // Reset card fields when switching from card
    if (selectedType !== 'card') {
      setCardholderName('');
      setCardNumber('');
      setExpiryMonth('');
      setExpiryYear('');
      setCvv('');
      setCardType('');
    }
    
    // Reset PayPal fields when switching from PayPal
    if (selectedType !== 'paypal') {
      setPaypalEmail('');
    }
  }, [selectedType]);

  // Validate form and update the isFormValid state
  useEffect(() => {
    const checkFormValidity = () => {
      if (!name.trim()) {
        return false;
      }

      switch (selectedType) {
        case 'card':
          if (!cardholderName.trim()) {
            return false;
          }

          const numberWithoutSpaces = cardNumber.replace(/\s+/g, '');
          if (numberWithoutSpaces.length < 13 || numberWithoutSpaces.length > 19) {
            return false;
          }

          if (!expiryMonth || !expiryYear) {
            return false;
          }

          const month = parseInt(expiryMonth, 10);
          if (month < 1 || month > 12) {
            return false;
          }

          if (cvv.length < 3) {
            return false;
          }
          break;

        case 'paypal':
          if (!paypalEmail.trim() || !isValidEmail(paypalEmail)) {
            return false;
          }
          break;

        case 'apple_pay':
        case 'google_pay':
          // Only name is required for these methods
          break;

        default:
          return false;
      }

      return true;
    };

    setIsFormValid(checkFormValidity());
  }, [name, cardholderName, cardNumber, expiryMonth, expiryYear, cvv, paypalEmail, selectedType]);

  // Validate form with alerts for submission
  const validateFormWithAlerts = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please provide a name for this payment method');
      return false;
    }

    switch (selectedType) {
      case 'card':
        if (!cardholderName.trim()) {
          Alert.alert('Error', 'Please enter the cardholder name');
          return false;
        }

        const numberWithoutSpaces = cardNumber.replace(/\s+/g, '');
        if (numberWithoutSpaces.length < 13 || numberWithoutSpaces.length > 19) {
          Alert.alert('Error', 'Invalid card number');
          return false;
        }

        if (!expiryMonth || !expiryYear) {
          Alert.alert('Error', 'Please enter the expiration date');
          return false;
        }

        const month = parseInt(expiryMonth, 10);
        if (month < 1 || month > 12) {
          Alert.alert('Error', 'Invalid expiration month');
          return false;
        }

        if (cvv.length < 3) {
          Alert.alert('Error', 'Invalid security code');
          return false;
        }
        break;

      case 'paypal':
        if (!paypalEmail.trim()) {
          Alert.alert('Error', 'Please enter your PayPal email address');
          return false;
        }
        if (!isValidEmail(paypalEmail)) {
          Alert.alert('Error', 'Please enter a valid email address');
          return false;
        }
        break;

      case 'apple_pay':
      case 'google_pay':
        // Only name validation is needed
        break;
    }

    return true;
  };

  // Save payment method
  const handleSave = async () => {
    if (!validateFormWithAlerts()) return;

    try {
      setLoading(true);

      const paymentMethodData: any = {
        name,
        type: selectedType,
      };

      // Add specific fields based on payment type
      switch (selectedType) {
        case 'card':
          paymentMethodData.cardholderName = cardholderName;
          paymentMethodData.cardNumber = cardNumber.replace(/\s+/g, '');
          paymentMethodData.expiryMonth = expiryMonth;
          paymentMethodData.expiryYear = expiryYear;
          paymentMethodData.cvv = cvv;
          paymentMethodData.cardType = cardType;
          break;

        case 'paypal':
          paymentMethodData.paypalEmail = paypalEmail;
          break;

        case 'apple_pay':
        case 'google_pay':
          // No additional fields needed
          break;
      }

      await patientAPI.addPaymentMethod(paymentMethodData);
      
      setLoading(false);
      Alert.alert(
        'Success',
        'Payment method added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Unable to add this payment method');
    }
  };

  const renderFormFields = () => {
    switch (selectedType) {
      case 'card':
        return (
          <>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Cardholder Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Full name on card"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Card Number</ThemedText>
              <View style={styles.cardNumberContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="number-pad"
                  maxLength={19}
                />
                {cardType && (
                  <ThemedText style={styles.cardTypeText}>{cardType}</ThemedText>
                )}
              </View>
            </View>
            
            <View style={styles.rowFormGroup}>
              <View style={[styles.formGroup, { flex: 2, marginRight: 8 }]}>
                <ThemedText style={styles.label}>Expiration Date</ThemedText>
                <View style={styles.expiryContainer}>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="MM"
                    value={expiryMonth}
                    onChangeText={setExpiryMonth}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <ThemedText style={styles.expiryDivider}>/</ThemedText>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="YY"
                    value={expiryYear}
                    onChangeText={setExpiryYear}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.label}>CVV</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </>
        );

      case 'paypal':
        return (
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>PayPal Email Address</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={paypalEmail}
              onChangeText={setPaypalEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        );

      case 'apple_pay':
        return (
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <ThemedText style={styles.infoText}>
              This will use the cards saved in your Apple Wallet
            </ThemedText>
          </View>
        );

      case 'google_pay':
        return (
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <ThemedText style={styles.infoText}>
              This will use the cards saved in your Google Pay account
            </ThemedText>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Add Payment Method',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0F2057" />
            </TouchableOpacity>
          )
        }}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Payment Type</ThemedText>
            <View style={styles.paymentTypesContainer}>
              {paymentTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.paymentTypeItem,
                    selectedType === type.id && styles.selectedPaymentType
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={24} 
                    color={selectedType === type.id ? COLORS.white : COLORS.darkBlue} 
                  />
                  <ThemedText style={[
                    styles.paymentTypeName,
                    selectedType === type.id && styles.selectedPaymentTypeName
                  ]}>
                    {type.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Information</ThemedText>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Payment Method Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g. My personal card"
                value={name}
                onChangeText={setName}
              />
            </View>
            
            {renderFormFields()}
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, !isFormValid && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <ThemedText style={styles.saveButtonText}>
                  Save
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 16,
  },
  paymentTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  paymentTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: '45%',
  },
  selectedPaymentType: {
    backgroundColor: COLORS.primary,
  },
  paymentTypeName: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.darkBlue,
  },
  selectedPaymentTypeName: {
    color: COLORS.white,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  rowFormGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.gray700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  smallInput: {
    flex: 1,
    textAlign: 'center',
  },
  cardNumberContainer: {
    position: 'relative',
  },
  cardTypeText: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 14,
    color: COLORS.gray600,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryDivider: {
    marginHorizontal: 8,
    fontSize: 18,
    color: COLORS.gray700,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray700,
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.gray400,
  },
});