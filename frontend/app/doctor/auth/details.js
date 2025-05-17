import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // Import for file picking
import api from '../../../services/api'; // Path should be correct after move

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
    // Changed from first_name, last_name to fullName to match Doctor model and signup
    // Backend controller for PUT /doctors/profile might need to handle splitting fullName if Doctor model stores first/last separately
    // Or, ensure Doctor model and PUT /doctors/profile consistently use fullName
    dateOfBirth: { day: '', month: '', year: '' },
    specialization: '', 
    selectedFiles: [], 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);

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
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });
      if (!result.canceled && result.assets) {
        setFormData(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...result.assets] }));
      }
    } catch (err) {
      console.warn(err);
      setError('Failed to pick documents.');
    }
  };

  const handleSubmit = async () => {
    // Ensure first_name and last_name are derived from fullName if needed by the API
    // For now, assuming API takes fullName directly based on Doctor model recent changes
    let first_name = formData.fullName.split(' ')[0] || '';
    let last_name = formData.fullName.split(' ').slice(1).join(' ') || '';
    
    if (!formData.fullName || !formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year || !formData.specialization) {
      setError('Please fill all required fields (Full Name, Date of Birth, Specialization).');
      return;
    }

    const dob = `${formData.dateOfBirth.year}-${String(formData.dateOfBirth.month).padStart(2, '0')}-${String(formData.dateOfBirth.day).padStart(2, '0')}`;

    setIsLoading(true);
    setError('');

    const dataToSubmit = new FormData();
    dataToSubmit.append('full_name', formData.fullName); // Changed from fullName to full_name to match model if needed
    dataToSubmit.append('first_name', first_name); // Sending first_name
    dataToSubmit.append('last_name', last_name);   // Sending last_name
    dataToSubmit.append('date_of_birth', dob);
    dataToSubmit.append('specialization', formData.specialization);
    
    formData.selectedFiles.forEach((file) => {
      dataToSubmit.append('certificationFiles', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
    });

    try {
      await api.put('/doctors/profile', dataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // After successful profile update, doctor should login again or be redirected to dashboard if session is now active.
      // Forcing login to ensure all backend states (like approval status) are re-checked.
      router.replace('/doctor/auth/login'); // Correction du chemin sans parenthèses
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Doctor&apos;s Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Lorem Ipsum"
            value={formData.fullName} // Using fullName from state
            onChangeText={(text) => updateFormField('fullName', text)}
          />
        </View>

        {/* Date of Birth Pickers */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDayDropdown(!showDayDropdown)}>
                <Text style={styles.dateButtonText}>{formData.dateOfBirth.day || 'Day'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showDayDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true} style={{maxHeight: 150}}>
                  {days.map((day) => (
                    <TouchableOpacity key={day} style={styles.dropdownItem} onPress={() => { updateDateField('day', day); setShowDayDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView></View>
              )}
            </View>
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowMonthDropdown(!showMonthDropdown)}>
                <Text style={styles.dateButtonText}>{months.find(m => m.value === formData.dateOfBirth.month)?.label || 'Month'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showMonthDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true} style={{maxHeight: 150}}>
                  {months.map((month) => (
                    <TouchableOpacity key={month.value} style={styles.dropdownItem} onPress={() => { updateDateField('month', month.value); setShowMonthDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{month.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView></View>
              )}
            </View>
            <View style={styles.dateDropdown}>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowYearDropdown(!showYearDropdown)}>
                <Text style={styles.dateButtonText}>{formData.dateOfBirth.year || 'Year'}</Text>
                <Ionicons name="chevron-down" size={18} color="#0A1E42" />
              </TouchableOpacity>
              {showYearDropdown && (
                <View style={styles.dropdownMenu}><ScrollView nestedScrollEnabled={true} style={{maxHeight: 150}}>
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
            <View style={styles.dropdownMenuFullWidth}><ScrollView nestedScrollEnabled={true} style={{maxHeight: 150}}>
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
            </ScrollView></View>
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
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{file.name} ({file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'size unknown'})</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.nextButton} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.nextButtonText}>SUBMIT DETAILS</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ... existing code ...
// Styles require review for consistency if this file is very different from patient details
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0A1E42', marginBottom: 30, textAlign: 'center' },
  formGroup: { marginBottom: 25 },
  label: { fontSize: 16, // Unified label size
     color: '#666', 
     marginBottom: 10 
  },
  input: {
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0', 
    fontSize: 16, 
    paddingVertical: 10,
    color: '#0A1E42'
  },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, // Added gap
  dateDropdown: { flex: 1 }, // Removed marginRight as gap is used now
  dateButton: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 10
  },
  dateButtonText: { fontSize: 16, color: '#0A1E42' },
  dropdownMenu: { 
    position: 'absolute', top: 40, left: 0, right: 0, 
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0', 
    borderRadius: 5, zIndex: 1000 // Ensure dropdown is on top
  },
  dropdownMenuFullWidth: { // For specialization dropdown to span full width if needed
    position: 'absolute', top: 40, left: 0, right: 0, 
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0', 
    borderRadius: 5, zIndex: 1000, maxHeight: 150 // Added maxHeight here too
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 16 }, 
  dropdownButton: { // Style for the main specialization dropdown touchable
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 10, 
  },
  dropdownButtonText: { fontSize: 16, color: '#0A1E42' },
  openFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7BAFD4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  openFilesButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileListContainer: {
    marginTop: 20,
  },
  fileListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    flexShrink: 1, // Allow text to shrink and show ellipsis
  },
  errorText: { color: 'red', marginBottom: 20, textAlign: 'center' },
  nextButton: {
    backgroundColor: '#7BAFD4', paddingVertical: 15, borderRadius: 10, 
    alignItems: 'center', marginTop: 30
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default DoctorDetailsScreen; 