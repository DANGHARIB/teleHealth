import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import * as DocumentPicker from 'expo-document-picker'; // Import for file picking
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
    certificationsText: '', // Simple text field for now
    specialization: '' // Added specialization state
    // selectedFiles: [], // For actual file uploads
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

  // const handleOpenFilePicker = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: '*/*', // Or specific types like 'application/pdf', 'image/*'
  //       multiple: true,
  //     });
  //     if (!result.canceled) {
  //       setFormData(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...result.assets] }));
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //     setError('Failed to pick documents.');
  //   }
  // };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year || !formData.specialization) {
      setError('Please fill all required fields (Full Name, Date of Birth, Specialization).');
      return;
    }

    const dob = `${formData.dateOfBirth.year}-${formData.dateOfBirth.month}-${formData.dateOfBirth.day}`;

    setIsLoading(true);
    setError('');

    // const dataToSubmit = new FormData(); // Use FormData for file uploads
    // dataToSubmit.append('fullName', formData.fullName);
    // dataToSubmit.append('date_of_birth', dob);
    // dataToSubmit.append('certifications', formData.certificationsText);
    // formData.selectedFiles.forEach((file, index) => {
    //   dataToSubmit.append(`certificationFile${index}`, {
    //     uri: file.uri,
    //     name: file.name,
    //     type: file.mimeType || 'application/octet-stream',
    //   });
    // });

    try {
      // For now, sending as JSON. For file uploads, use FormData and adjust backend controller
      const response = await api.put('/doctors/profile', {
        full_name: formData.fullName,
        date_of_birth: dob,
        certifications: formData.certificationsText, // Simple text for now
        specialization: formData.specialization // Send selected specialization
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
          <Text style={styles.label}>Certifications (Lorem Ipsum...)</Text>
          {/* <TouchableOpacity style={styles.openFilesButton} onPress={handleOpenFilePicker}>
            <Text style={styles.openFilesButtonText}>Open Files</Text>
          </TouchableOpacity>
          <View style={styles.fileDropzone}>
            <Ionicons name="cloud-upload-outline" size={50} color="#ccc" />
            <Text style={styles.fileDropzoneText}>Click to browse or drag and drop your files</Text>
          </View>
          {formData.selectedFiles.map((file, index) => (
            <Text key={index} style={styles.fileName}>{file.name}</Text>
          ))} */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter details about your certifications..."
            value={formData.certificationsText}
            onChangeText={(text) => updateFormField('certificationsText', text)}
            multiline
            numberOfLines={4}
          />
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
    backgroundColor: '#7BAFD4', paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 8, alignItems: 'center', marginBottom: 10, alignSelf: 'flex-start'
  },
  openFilesButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  fileDropzone: {
    borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 10,
    padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', marginBottom: 10, minHeight: 100
  },
  fileDropzoneText: { color: '#aaa', textAlign: 'center' },
  fileName: { fontSize: 14, color: '#333', marginTop: 5 },
  errorText: { color: 'red', marginBottom: 20, textAlign: 'center' },
  nextButton: {
    backgroundColor: '#7BAFD4', paddingVertical: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 20
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default DoctorDetailsScreen; 