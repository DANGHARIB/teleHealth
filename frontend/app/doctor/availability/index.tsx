import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Animated,
  Platform
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow, isAfter } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';
import { DARK_BLUE_THEME, LIGHT_BLUE_ACCENT } from '@/constants/Colors';

type Availability = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export default function AvailabilityScreen() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const animateIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  
  // Function to load availabilities
  const fetchAvailabilities = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await doctorAPI.getMyAvailability();
      
      // Sort availabilities by date and time
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime() || 
               a.startTime.localeCompare(b.startTime);
      });
      
      setAvailabilities(sortedData);
      fadeAnim.setValue(0);
      animateIn();
      
      if (showRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading availabilities:', err);
      setError('Unable to load your availabilities');
      if (showRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [animateIn, fadeAnim]);
  
  const onRefresh = useCallback(() => {
    fetchAvailabilities(true);
    // Provide haptic feedback on refresh
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [fetchAvailabilities]);
  
  // Load availabilities on initial load and each time we return to the page
  useFocusEffect(
    useCallback(() => {
      fetchAvailabilities();
      return () => {
        // Optional cleanup
      };
    }, [fetchAvailabilities])
  );
  
  // Delete an availability
  const handleDeleteAvailability = async (id: string) => {
    try {
      // Find the availability to display in the alert
      const availability = availabilities.find(a => a._id === id);
      if (!availability) return;
      
      const formattedDate = format(parseISO(availability.date), 'MMMM dd, yyyy');
      
      // Provide haptic feedback before showing the alert
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      Alert.alert(
        'Confirmation',
        `Do you want to delete this availability on ${formattedDate} from ${availability.startTime} to ${availability.endTime}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await doctorAPI.deleteAvailability(id);
              
              // Provide success haptic feedback
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              // Update the list
              fetchAvailabilities();
              
              Alert.alert('Success', 'Availability successfully deleted');
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error deleting availability:', err);
      Alert.alert('Error', 'Unable to delete this availability');
      setLoading(false);
    }
  };
  
  // Format the date header in a user-friendly way
  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM dd, yyyy');
    }
  };
  
  // Group availabilities by day for display
  const groupedAvailabilities = availabilities.reduce((groups, availability) => {
    const date = format(parseISO(availability.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(availability);
    return groups;
  }, {} as Record<string, Availability[]>);
  
  // Convert grouped dates to array for display
  const dateGroups = Object.keys(groupedAvailabilities).sort();
  
  // Get future availability count
  const futureAvailabilitiesCount = availabilities.filter(availability => {
    const availabilityDate = parseISO(availability.date);
    
    // Si c'est déjà réservé, ne pas compter
    if (availability.isBooked) return false;
    
    // Si c'est une date future, compter
    if (isAfter(availabilityDate, new Date())) return true;
    
    // Si c'est aujourd'hui, vérifier si l'heure est passée ou non
    if (isToday(availabilityDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const [availStartHour, availStartMinute] = availability.startTime.split(':').map(Number);
      
      // Convertir en minutes pour faciliter la comparaison
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const availStartTimeInMinutes = availStartHour * 60 + availStartMinute;
      
      // Ne compter que si l'heure de début n'est pas encore passée
      return availStartTimeInMinutes > currentTimeInMinutes;
    }
    
    // Si c'est dans le passé, ne pas compter
    return false;
  }).length;
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="calendar-o" size={70} color={LIGHT_BLUE_ACCENT} />
      <ThemedText style={styles.emptyText}>No availability defined</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Add your first availability slots by clicking the button below
      </ThemedText>
      <View style={styles.emptyStateSteps}>
        <View style={styles.emptyStateStep}>
          <View style={styles.stepCircle}><ThemedText style={styles.stepNumber}>1</ThemedText></View>
          <ThemedText style={styles.stepText}>Click "Add Availability Slots"</ThemedText>
        </View>
        <View style={styles.emptyStateStep}>
          <View style={styles.stepCircle}><ThemedText style={styles.stepNumber}>2</ThemedText></View>
          <ThemedText style={styles.stepText}>Select dates and times</ThemedText>
        </View>
        <View style={styles.emptyStateStep}>
          <View style={styles.stepCircle}><ThemedText style={styles.stepNumber}>3</ThemedText></View>
          <ThemedText style={styles.stepText}>Save to make yourself available</ThemedText>
        </View>
      </View>
    </View>
  );
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerBackTitle: 'Back',
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#fff',
          },
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.pageTitle}>Availability</ThemedText>
          {!loading && availabilities.length > 0 && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{futureAvailabilitiesCount}</ThemedText>
                <ThemedText style={styles.statLabel}>Available Slots</ThemedText>
              </View>
            </View>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DARK_BLUE_THEME} style={styles.loader} />
            <ThemedText style={styles.loadingText}>Loading your schedule...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#F44336" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchAvailabilities()}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : availabilities.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView 
            style={styles.contentContainer}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[DARK_BLUE_THEME]}
                tintColor={DARK_BLUE_THEME}
              />
            }
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {dateGroups.map(dateString => (
                <View key={dateString} style={styles.dateGroup}>
                  <View style={styles.dateHeaderContainer}>
                    <View style={styles.dateHeaderLine} />
                    <ThemedText style={styles.dateHeader}>
                      {formatDateHeader(dateString)}
                    </ThemedText>
                    <View style={styles.dateHeaderLine} />
                  </View>
                  
                  {groupedAvailabilities[dateString].map(availability => (
                    <View key={availability._id} style={[
                      styles.slotCard,
                      availability.isBooked && styles.bookedSlot
                    ]}>
                      <View style={styles.slotInfo}>
                        <View style={styles.timeContainer}>
                          <ThemedText style={styles.timeText}>
                            {availability.startTime} - {availability.endTime}
                          </ThemedText>
                          {isToday(parseISO(availability.date)) && (
                            <View style={styles.todayBadge}>
                              <ThemedText style={styles.todayText}>Today</ThemedText>
                            </View>
                          )}
                        </View>
                        {availability.isBooked && (
                          <View style={styles.bookedBadge}>
                            <MaterialIcons name="event-busy" size={12} color={LIGHT_BLUE_ACCENT} style={styles.bookedIcon} />
                            <ThemedText style={styles.bookedText}>Booked</ThemedText>
                          </View>
                        )}
                      </View>
                      
                      {!availability.isBooked && (
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteAvailability(availability._id)}
                        >
                          <FontAwesome name="trash-o" size={18} color={DARK_BLUE_THEME} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        )}
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push('/doctor/availability/create');
          }}
          activeOpacity={0.8}
        >
          <FontAwesome name="calendar-plus-o" size={20} color="#fff" style={styles.addIcon} />
          <ThemedText style={styles.addButtonText}>Add Availability Slots</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LIGHT_BLUE_ACCENT,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 95,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: DARK_BLUE_THEME,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: LIGHT_BLUE_ACCENT,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 35,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addIcon: {
    marginRight: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: 20,
    paddingBottom: 75,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: DARK_BLUE_THEME,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyStateSteps: {
    width: '100%',
    marginTop: 10,
    alignItems: 'flex-start',
  },
  emptyStateStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIGHT_BLUE_ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 15,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: DARK_BLUE_THEME,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 10,
    textTransform: 'capitalize',
    color: DARK_BLUE_THEME,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  bookedSlot: {
    backgroundColor: '#fafafa',
    borderLeftWidth: 3,
    borderLeftColor: LIGHT_BLUE_ACCENT,
  },
  slotInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK_BLUE_THEME,
  },
  todayBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  todayText: {
    color: '#2196F3',
    fontSize: 10,
    fontWeight: '600',
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bookedIcon: {
    marginRight: 4,
  },
  bookedText: {
    color: LIGHT_BLUE_ACCENT,
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
}); 