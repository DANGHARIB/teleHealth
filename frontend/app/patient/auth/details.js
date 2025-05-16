import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import api from '../../../services/api';

const PatientDetailsScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'Male', // Default value
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
    // Validate inputs
    if (!formData.first_name || !formData.last_name) {
      setError('Please enter both first and last name');
      return;
    }

    // Validate date
    if (!formData.date.day || !formData.date.month || !formData.date.year) {
      setError('Please select your date of birth');
      return;
    }

    const dateOfBirth = `${formData.date.year}-${formData.date.month}-${formData.date.day}`;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.put('/patients/profile', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: dateOfBirth
      });

      // On success, navigate to verified screen
      router.replace('/patient/auth/verified');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate arrays for day, month, and year dropdowns
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].map((month, index) => ({ label: month, value: String(index + 1).padStart(2, '0') }));
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
            {/* Day dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDayDropdown(!showDayDropdown)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.date.day || 'Day'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              
              {showDayDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={styles.dropdownItem}
                        onPress={() => {
                          updateDateField('day', day);
                          setShowDayDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Month dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowMonthDropdown(!showMonthDropdown)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.date.month ? 
                    months.find(m => m.value === formData.date.month)?.label || 'Month' 
                    : 'Month'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              
              {showMonthDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          updateDateField('month', month.value);
                          setShowMonthDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{month.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {/* Year dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowYearDropdown(!showYearDropdown)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.date.year || 'Year'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              
              {showYearDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={styles.dropdownItem}
                        onPress={() => {
                          updateDateField('year', year);
                          setShowYearDropdown(false);
                        }}
                      >
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
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateFormField('gender', 'Male')}
            >
              <View style={[
                styles.radioCircle,
                formData.gender === 'Male' && styles.radioCircleSelected
              ]}>
                {formData.gender === 'Male' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Male</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateFormField('gender', 'Female')}
            >
              <View style={[
                styles.radioCircle,
                formData.gender === 'Female' && styles.radioCircleSelected
              ]}>
                {formData.gender === 'Female' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Female</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => updateFormField('gender', 'Other')}
            >
              <View style={[
                styles.radioCircle,
                formData.gender === 'Other' && styles.radioCircleSelected
              ]}>
                {formData.gender === 'Other' && <View style={styles.radioCircleFill} />}
              </View>
              <Text style={styles.radioText}>Others</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A1E42',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    color: '#0A1E42',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateDropdown: {
    width: '30%',
    position: 'relative',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0A1E42',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0A1E42',
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7BAFD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: '#0A1E42',
  },
  radioCircleFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0A1E42',
  },
  radioText: {
    fontSize: 16,
    color: '#0A1E42',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#7BAFD4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PatientDetailsScreen; 