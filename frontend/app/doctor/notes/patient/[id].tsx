import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { doctorAPI } from '@/services/api';

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

export default function PatientNotes() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);

  // Charger les détails du patient et ses notes
  const loadPatientNotes = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Charger le patient
      const patientData = await doctorAPI.getSavedPatients();
      const foundPatient = patientData.find((p: any) => p._id === id);
      
      if (foundPatient) {
        setPatient(foundPatient);
      }
      
      // Charger les notes
      const notesData = await doctorAPI.getPatientNotes(id as string);
      setNotes(notesData);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les notes du patient.'
      );
      setLoading(false);
    }
  }, [id]);

  // Charger les données au chargement initial
  useEffect(() => {
    loadPatientNotes();
  }, [loadPatientNotes]);

  // Actualiser les données lors du retour sur cette page
  useFocusEffect(
    useCallback(() => {
      loadPatientNotes();
    }, [loadPatientNotes])
  );

  // Fonction pour formater la date
  const formatNoteDate = (note: any) => {
    if (!note || !note.appointment || !note.appointment.availability || !note.appointment.availability.date) {
      return 'Date inconnue';
    }
    
    try {
      return format(new Date(note.appointment.availability.date), 'dd/MM/yyyy');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Rafraîchissement des données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPatientNotes();
    setRefreshing(false);
  }, [loadPatientNotes]);

  // Ouvrir une note
  const openNote = (noteId: string) => {
    router.push(`/doctor/notes/${noteId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <ThemedText style={styles.loadingText}>Chargement des notes...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'Notes du patient',
          headerBackTitle: 'Retour',
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {patient && (
          <ThemedView style={styles.patientInfoCard}>
            <ThemedText style={styles.patientName}>
              {patient.first_name || ''} {patient.last_name || ''}
            </ThemedText>
            {patient.gender && patient.date_of_birth && (
              <ThemedText style={styles.patientDetails}>
                {patient.gender} • {format(new Date(patient.date_of_birth), 'dd/MM/yyyy')}
              </ThemedText>
            )}
          </ThemedView>
        )}
        
        <ThemedText style={styles.sectionTitle}>Historique des notes</ThemedText>
        
        {notes.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.gray300} />
            <ThemedText style={styles.emptyTitle}>Aucune note</ThemedText>
            <ThemedText style={styles.emptyText}>
              Vous n&apos;avez pas encore créé de notes pour ce patient.
            </ThemedText>
          </ThemedView>
        ) : (
          notes.map((note) => (
            <TouchableOpacity
              key={note._id}
              style={styles.noteCard}
              onPress={() => openNote(note._id)}
            >
              <View style={styles.noteHeader}>
                <ThemedText style={styles.noteDate}>
                  {formatNoteDate(note)}
                </ThemedText>
                <ThemedText style={styles.noteTime}>
                  {note.appointment?.slotStartTime || ''} - {note.appointment?.slotEndTime || ''}
                </ThemedText>
              </View>
              
              <View style={styles.noteContent}>
                <ThemedText style={styles.noteText} numberOfLines={3}>
                  {note.content}
                </ThemedText>
              </View>
              
              {note.diagnosis && (
                <View style={styles.tagContainer}>
                  <View style={styles.diagnosisTag}>
                    <Ionicons name="medkit-outline" size={14} color={COLORS.primary} />
                    <ThemedText style={styles.tagText}>
                      {note.diagnosis.length > 25 ? note.diagnosis.substring(0, 22) + '...' : note.diagnosis}
                    </ThemedText>
                  </View>
                </View>
              )}
              
              <View style={styles.noteFooter}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
              </View>
            </TouchableOpacity>
          ))
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
  scrollView: {
    flex: 1,
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
  patientInfoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 16,
    color: COLORS.gray500,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  noteDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  noteTime: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  noteContent: {
    padding: 16,
    paddingBottom: 12,
  },
  noteText: {
    fontSize: 15,
    color: COLORS.gray700,
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  diagnosisTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 4,
  },
  noteFooter: {
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
}); 