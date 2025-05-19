import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';
import { format } from 'date-fns';

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

export default function EditAppointmentNote() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<any>(null);
  
  // États pour les champs de la note
  const [content, setContent] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');

  // Charger les détails de la note
  useEffect(() => {
    const fetchNoteDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await doctorAPI.getNoteById(id as string);
        setNote(data);
        
        // Initialiser les champs avec les données existantes
        setContent(data.content || '');
        setDiagnosis(data.diagnosis || '');
        setTreatment(data.treatment || '');
        setAdvice(data.advice || '');
        setFollowUp(data.followUp || '');
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement de la note:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les détails de la note.'
        );
        setLoading(false);
      }
    };

    fetchNoteDetails();
  }, [id]);

  // Formater la date du rendez-vous
  const formatAppointmentDate = (note: any) => {
    if (!note || !note.appointment || !note.appointment.availability || !note.appointment.availability.date) {
      return 'Date inconnue';
    }
    
    try {
      const date = new Date(note.appointment.availability.date);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Mettre à jour la note
  const updateNote = async () => {
    if (!content.trim()) {
      Alert.alert('Erreur', 'Le contenu de la note ne peut pas être vide.');
      return;
    }

    try {
      setSaving(true);
      
      await doctorAPI.updateAppointmentNote(id as string, {
        content,
        diagnosis,
        treatment,
        advice,
        followUp
      });
      
      setSaving(false);
      Alert.alert(
        'Succès',
        'La note a été mise à jour avec succès.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      setSaving(false);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour la note. Veuillez réessayer.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <ThemedText style={styles.loadingText}>Chargement de la note...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Modifier la note',
          headerBackTitle: 'Retour',
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          {note && note.appointment && (
            <ThemedView style={styles.appointmentInfoCard}>
              <ThemedText style={styles.appointmentInfoTitle}>
                Détails du rendez-vous
              </ThemedText>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Patient:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {note.patient ? 
                    `${note.patient.first_name || ''} ${note.patient.last_name || ''}`.trim() || 'Nom non disponible' 
                    : 'Patient non disponible'}
                </ThemedText>
              </View>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Date:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {formatAppointmentDate(note)}
                </ThemedText>
              </View>
              
              <View style={styles.appointmentInfoRow}>
                <ThemedText style={styles.appointmentInfoLabel}>Horaire:</ThemedText>
                <ThemedText style={styles.appointmentInfoValue}>
                  {note.appointment.slotStartTime} - {note.appointment.slotEndTime}
                </ThemedText>
              </View>
              
              {note.appointment.caseDetails && (
                <View style={styles.appointmentInfoRow}>
                  <ThemedText style={styles.appointmentInfoLabel}>Motif:</ThemedText>
                  <ThemedText style={styles.appointmentInfoValue}>
                    {note.appointment.caseDetails}
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          )}
          
          <ThemedView style={styles.noteCard}>
            <ThemedText style={styles.sectionTitle}>Note générale</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Entrez vos notes sur la consultation..."
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />
            
            <ThemedText style={styles.sectionTitle}>Diagnostic</ThemedText>
            <RNTextInput
              style={styles.textInput}
              placeholder="Entrez le diagnostic établi"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />
            
            <ThemedText style={styles.sectionTitle}>Traitement prescrit</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Entrez le traitement prescrit"
              multiline
              textAlignVertical="top"
              value={treatment}
              onChangeText={setTreatment}
            />
            
            <ThemedText style={styles.sectionTitle}>Conseils</ThemedText>
            <RNTextInput
              style={styles.textArea}
              placeholder="Entrez les conseils donnés au patient"
              multiline
              textAlignVertical="top"
              value={advice}
              onChangeText={setAdvice}
            />
            
            <ThemedText style={styles.sectionTitle}>Suivi recommandé</ThemedText>
            <RNTextInput
              style={styles.textInput}
              placeholder="Entrez le suivi recommandé"
              value={followUp}
              onChangeText={setFollowUp}
            />
          </ThemedView>
        </ScrollView>
        
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={updateNote}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={COLORS.white} />
                <ThemedText style={styles.saveButtonText}>Mettre à jour</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray500,
  },
  appointmentInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  appointmentInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  appointmentInfoLabel: {
    fontWeight: '600',
    color: COLORS.gray700,
    width: 80,
  },
  appointmentInfoValue: {
    flex: 1,
    color: COLORS.gray800,
  },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 80, // Espace pour le actionBar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray800,
    backgroundColor: COLORS.gray100,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.gray800,
    backgroundColor: COLORS.gray100,
    minHeight: 100,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
}); 