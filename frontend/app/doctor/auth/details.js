import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // Import for file picking
import api from '../../../services/api'; // Ensure this path is correct

const SPECIALIZATIONS = [
  "Depression/Anxiety",
  "Child Development",
  "Emotional Support",
  "PTSD/Trauma",
  "Disability Support"
];

const DoctorDetailsScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: { day: '', month: '', year: '' },
    specialization: '', // Added specialization state
    selectedFiles: [], // For actual file uploads
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Dropdown states (similar to patient details)
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false); // State for specialization dropdown

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: { ...prev.dateOfBirth, [field]: value }
    }));
  };

  const handleOpenFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'], // Allow PDF and images
        multiple: true,
      });
      if (!result.canceled && result.assets) { // check for result.assets
        setFormData(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...result.assets] }));
      }
    } catch (err) {
      console.warn(err);
      setError('Failed to pick documents.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year || !formData.specialization) {
      setError('Please fill all required fields (Full Name, Date of Birth, Specialization).');
      return;
    }

    const dob = `${formData.dateOfBirth.year}-${formData.dateOfBirth.month}-${formData.dateOfBirth.day}`;

    setIsLoading(true);
    setError('');

    const dataToSubmit = new FormData(); // Use FormData for file uploads
    dataToSubmit.append('fullName', formData.fullName);
    dataToSubmit.append('date_of_birth', dob);
    dataToSubmit.append('specialization', formData.specialization);
    formData.selectedFiles.forEach((file, index) => {
      dataToSubmit.append('certificationFiles', { // Use a consistent name, e.g., 'certificationFiles' for multiple files
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
    });

    try {
      // Sending as FormData
      const response = await api.put('/doctors/profile', dataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for FormData
        },
      });

      router.replace('/doctor/auth/login'); // Navigate to login after details submission
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.title}>Doctor&apos;s Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Lorem Ipsum"
            value={formData.fullName}
            onChangeText={(text) => updateFormField('fullName', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.dateContainer}>
            {/* Day dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDayDropdown(!showDayDropdown)}>
                <Text style={styles.dateButtonText}>{formData.dateOfBirth.day || 'Day'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showDayDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true}>
                  {days.map((day) => (
                    <TouchableOpacity key={day} style={styles.dropdownItem} onPress={() => { updateDateField('day', day); setShowDayDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView></View>
              )}
            </View>
            {/* Month dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowMonthDropdown(!showMonthDropdown)}>
                <Text style={styles.dateButtonText}>{formData.dateOfBirth.month ? months.find(m => m.value === formData.dateOfBirth.month)?.label || 'Month' : 'Month'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showMonthDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true}>
                  {months.map((month) => (
                    <TouchableOpacity key={month.value} style={styles.dropdownItem} onPress={() => { updateDateField('month', month.value); setShowMonthDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{month.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView></View>
              )}
            </View>
            {/* Year dropdown */}
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowYearDropdown(!showYearDropdown)}>
                <Text style={styles.dateButtonText}>{formData.dateOfBirth.year || 'Year'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showYearDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true}>
                  {years.map((year) => (
                    <TouchableOpacity key={year} style={styles.dropdownItem} onPress={() => { updateDateField('year', year); setShowYearDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView></View>
              )}
            </View>
          </View>
        </View>

        {/* Specialization Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Specialization</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowSpecializationDropdown(!showSpecializationDropdown)}>
            <Text style={styles.dropdownButtonText}>{formData.specialization || 'Select Specialization'}</Text>
            <Ionicons name="chevron-down" size={18} color="#0A1E42" />
          </TouchableOpacity>
          {showSpecializationDropdown && (
            <View style={styles.dropdownMenuFullWidth}>
              <ScrollView nestedScrollEnabled={true}>
                {SPECIALIZATIONS.map((spec, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateFormField('specialization', spec);
                      setShowSpecializationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Certifications</Text>
          <TouchableOpacity style={styles.openFilesButton} onPress={handleOpenFilePicker}>
            <Ionicons name="attach-outline" size={20} color="white" style={{marginRight: 5}} />
            <Text style={styles.openFilesButtonText}>Upload Certifications (PDF/Image)</Text>
          </TouchableOpacity>
          
          {formData.selectedFiles.length > 0 && (
            <View style={styles.fileListContainer}>
              <Text style={styles.label}>Selected Files:</Text>
              {formData.selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileListItem}>
                  <Ionicons name="document-text-outline" size={20} color="#0A1E42" />
                  <Text style={styles.fileName}>{file.name} ({file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'size unknown'})</Text>
                  {/* Optional: Add a button to remove a selected file */}
                </View>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.nextButton} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.nextButtonText}>Next</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A1E42', marginBottom: 30 },
  formGroup: { marginBottom: 25 },
  label: { fontSize: 18, color: '#0A1E42', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#F8F9FA'
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dateDropdown: { width: '30%', position: 'relative' },
  dateButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#F8F9FA'
  },
  dateButtonText: { fontSize: 16, color: '#0A1E42' },
  dropdownButton: { // For Specialization Dropdown (full width)
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#F8F9FA', 
    width: '100%' 
  },
  dropdownButtonText: { fontSize: 16, color: '#0A1E42' },
  dropdownMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, marginTop: 5, zIndex: 1000, maxHeight: 150
  },
  dropdownMenuFullWidth: { // For Specialization dropdown
    backgroundColor: 'white',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, 
    marginTop: 5, zIndex: 1000, maxHeight: 200 // Adjust maxHeight as needed
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15 }, // Increased padding for better touch
  dropdownItemText: { fontSize: 16, color: '#0A1E42' },
  openFilesButton: {
    backgroundColor: '#7BAFD4', paddingVertical: 12, paddingHorizontal: 15, // Adjusted padding
    borderRadius: 10, alignItems: 'center', marginBottom: 10, // alignSelf: 'flex-start' // Removed to make it full width by default or control with parent
    flexDirection: 'row', // To align icon and text
    justifyContent: 'center', // To center content
  },
  openFilesButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }, // Adjusted fontSize
  fileListContainer: { // Added style
    marginTop: 10,
  },
  fileListItem: { // Added style
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    marginBottom: 5,
  },
  fileName: { fontSize: 14, color: '#0A1E42', marginLeft: 8 }, // Adjusted color and added margin
  errorText: { color: 'red', marginBottom: 20, textAlign: 'center' },
  nextButton: {
    backgroundColor: '#7BAFD4', paddingVertical: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 20
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default DoctorDetailsScreen; 