import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import api from '../../../services/api'; // Chemin relatif corrigé
import AsyncStorage from '@react-native-async-storage/async-storage';

const PatientDetailsScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // récupérer l'email passé en paramètre
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'Male', 
    date: {
      day: '',
      month: '',
      year: '',
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      date: {
        ...prev.date,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Please enter both first and last name');
      return;
    }
    if (!formData.date.day || !formData.date.month || !formData.date.year) {
      setError('Please select your date of birth');
      return;
    }

    const dateOfBirth = `${formData.date.year}-${String(formData.date.month).padStart(2, '0')}-${String(formData.date.day).padStart(2, '0')}`;

    setIsLoading(true);
    setError('');

    try {
      // Stocker temporairement les détails du patient pour les utiliser après vérification
      // Au lieu d'appeler l'API immédiatement, nous stockerons les détails localement
      const patientDetails = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: dateOfBirth
      };
      
      // Stocker les détails dans localStorage pour les récupérer après vérification
      await AsyncStorage.setItem('tempPatientDetails', JSON.stringify(patientDetails));

      // Rediriger vers l'écran de vérification OTP
      router.push({
        pathname: '/patient/auth/verify',
        params: { email }
      });
    } catch (err) {
      setError('Failed to save details');
    } finally {
      setIsLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = [
    { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
    { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
    { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
    { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Patient&apos;s Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Lorem Ipsum"
            value={formData.first_name}
            onChangeText={(text) => updateFormField('first_name', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Lorem Ipsum"
            value={formData.last_name}
            onChangeText={(text) => updateFormField('last_name', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateDropdown}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDayDropdown(!showDayDropdown)}
              >
                <Text style={styles.dateButtonText}>{formData.date.day || 'Day'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showDayDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {days.map((day) => (
                      <TouchableOpacity key={day} style={styles.dropdownItem} onPress={() => { updateDateField('day', day); setShowDayDropdown(false); }}>
                        <Text style={styles.dropdownItemText}>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowMonthDropdown(!showMonthDropdown)}>
                <Text style={styles.dateButtonText}>{months.find(m => m.value === formData.date.month)?.label || 'Month'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showMonthDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {months.map((month) => (
                      <TouchableOpacity key={month.value} style={styles.dropdownItem} onPress={() => { updateDateField('month', month.value); setShowMonthDropdown(false); }}>
                        <Text style={styles.dropdownItemText}>{month.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowYearDropdown(!showYearDropdown)}>
                <Text style={styles.dateButtonText}>{formData.date.year || 'Year'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showYearDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {years.map((year) => (
                      <TouchableOpacity key={year} style={styles.dropdownItem} onPress={() => { updateDateField('year', year); setShowYearDropdown(false); }}>
                        <Text style={styles.dropdownItemText}>{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={styles.radioOption} onPress={() => updateFormField('gender', 'Male')}>
              <View style={[styles.radioCircle, formData.gender === 'Male' && styles.radioCircleSelected]}>
                {formData.gender === 'Male' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioOption} onPress={() => updateFormField('gender', 'Female')}>
              <View style={[styles.radioCircle, formData.gender === 'Female' && styles.radioCircleSelected]}>
                {formData.gender === 'Female' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioOption} onPress={() => updateFormField('gender', 'Other')}>
              <View style={[styles.radioCircle, formData.gender === 'Other' && styles.radioCircleSelected]}>
                {formData.gender === 'Other' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Other</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>SAVE DETAILS</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A1E42', marginTop: 40, marginBottom: 30, textAlign: 'center' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, color: '#666', marginBottom: 10 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', fontSize: 16, paddingVertical: 10, color: '#0A1E42' },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dateDropdown: { flex: 1, marginRight: 10 }, // Added marginRight for spacing
  dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 10 },
  dateButtonText: { fontSize: 16, color: '#0A1E42' },
  dropdownMenu: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 5, zIndex: 1, maxHeight: 150 }, // Reduced maxHeight
  dropdownItem: { padding: 10 },
  dropdownItemText: { fontSize: 16 }, 
  radioGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#7BAFD4', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  radioCircleSelected: { borderColor: '#0A1E42' },
  radioCircleFill: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#0A1E42' },
  radioText: { fontSize: 16, color: '#0A1E42' }, 
  errorText: { color: 'red', marginBottom: 20, textAlign: 'center' },
  submitButton: { backgroundColor: '#7BAFD4', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default PatientDetailsScreen; 