import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Modal,
  FlatList,
  Animated
} from 'react-native';
import { Stack, router } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, isToday, isTomorrow, getMonth, getYear } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { doctorAPI } from '@/services/api';
import { DARK_BLUE_THEME, LIGHT_BLUE_ACCENT } from '@/constants/Colors';

type TimeSlot = {
  startTime: string;
  endTime: string;
  id: string; // For animation and tracking
};

// Fonction pour obtenir le prochain créneau horaire disponible
const getNextAvailableTime = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Trouver le prochain créneau disponible en incréments de 30 minutes
  let nextAvailableHour = currentHour;
  let nextAvailableMinute = 0;
  
  // Arrondir à l'intervalle de 30 minutes suivant
  if (currentMinute < 30) {
    nextAvailableMinute = 30;
  } else {
    nextAvailableHour = currentHour + 1;
    nextAvailableMinute = 0;
  }
  
  // Si on passe à l'heure suivante et que c'est minuit, limiter à 23:30
  if (nextAvailableHour >= 24) {
    nextAvailableHour = 23;
    nextAvailableMinute = 30;
  }
  
  return {
    hour: nextAvailableHour,
    minute: nextAvailableMinute,
    formatted: `${nextAvailableHour.toString().padStart(2, '0')}:${nextAvailableMinute.toString().padStart(2, '0')}`
  };
};

// Fonction pour créer un slot initial avec l'heure actuelle
const getInitialTimeSlot = (): TimeSlot => {
  const startTime = getNextAvailableTime();
  
  // Ajouter une heure pour l'heure de fin
  let endHour = startTime.hour + 1;
  let endMinute = startTime.minute;
  
  // Si on dépasse minuit
  if (endHour >= 24) {
    endHour = 23;
    endMinute = 59;
  }
  
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  return {
    startTime: startTime.formatted,
    endTime: endTime,
    id: Date.now().toString()
  };
};

export default function CreateAvailabilityScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState<number | null>(null);
  const [showEndTimePicker, setShowEndTimePicker] = useState<number | null>(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [currentEditingSlot, setCurrentEditingSlot] = useState<{index: number, isStart: boolean} | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    // Initialiser avec l'heure actuelle arrondie aux 15 minutes suivantes
    return [getInitialTimeSlot()];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTipTooltip, setShowTipTooltip] = useState(false);
  
  // Animation pour l'info-bulle
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  
  // Reference for the horizontal day scroll
  const dayScrollRef = useRef<ScrollView>(null);
  
  // Effet pour afficher/masquer l'info-bulle
  useEffect(() => {
    if (showTipTooltip) {
      // Animation pour afficher
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      // Animation pour masquer
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [showTipTooltip]);
  
  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };
  
  // Handle date change
  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCalendarModal(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      
      // Si on change la date pour aujourd'hui, mettre à jour l'heure aussi
      if (isToday(selectedDate)) {
        setSlots([getInitialTimeSlot()]);
      }
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
  
  // Handle calendar modal closing
  const handleCalendarDone = () => {
    setShowCalendarModal(false);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Handle time change
  const onTimeChange = (event: any, selectedTime: Date | undefined, slotIndex: number, isStart: boolean) => {
    if (Platform.OS === 'android') {
      isStart ? setShowStartTimePicker(null) : setShowEndTimePicker(null);
    }
    
    if (selectedTime) {
      const formattedTime = format(selectedTime, 'HH:mm');
      const newSlots = [...slots];
      
      if (isStart) {
        newSlots[slotIndex].startTime = formattedTime;
      } else {
        newSlots[slotIndex].endTime = formattedTime;
      }
      
      setSlots(newSlots);
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // For iOS, close the picker after selection
        isStart ? setShowStartTimePicker(null) : setShowEndTimePicker(null);
      }
    }
  };
  
  // Check if an hour is in the past
  const isHourDisabled = (hour: string) => {
    if (!isToday(date)) {
      return false; // Only disable hours for today
    }
    const currentHour = new Date().getHours();
    return parseInt(hour) < currentHour;
  };

  // Check if a minute is in the past
  const isMinuteDisabled = (minute: string, selectedHour: string) => {
    if (!isToday(date)) {
      return false; // Only disable minutes for today
    }
    
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const hour = parseInt(selectedHour);
    
    if (hour > currentHour) {
      return false; // Future hour, all minutes are valid
    }
    
    if (hour === currentHour) {
      // For 30-minute intervals: 
      // If minute is '00' and current time is past the hour, disable
      // If minute is '30' and current time is past 30 minutes, disable
      if (minute === '00') {
        return currentMinute > 0; // Disable if we're past the hour
      } else if (minute === '30') {
        return currentMinute >= 30; // Disable if we're at or past 30 minutes
      }
    }
    
    return true; // Past hour, all minutes are disabled
  };
  
  // Refs for FlatLists to allow scrolling to specific items
  const hourListRef = React.useRef<FlatList>(null);
  const minuteListRef = React.useRef<FlatList>(null);
  
  // Calculate the first available hour index for today
  const getFirstAvailableHourIndex = () => {
    if (!isToday(date)) return 0; // Start at the beginning if not today
    
    const currentHour = new Date().getHours();
    return currentHour; // This will be the index in our hours array
  };

  // Calculate the first available minute index for the current hour
  const getFirstAvailableMinuteIndex = (hourIndex: number) => {
    if (!isToday(date) || hourIndex > new Date().getHours()) 
      return 0; // Start at the beginning if not today or future hour
    
    if (hourIndex < new Date().getHours()) 
      return -1; // No available minutes for past hours
      
    // Current hour logic
    const currentMinute = new Date().getMinutes();
    if (currentMinute < 30) return 1; // Index of '30'
    return -1; // No available minutes in this hour
  };
  
  // Handle time picker modal opening
  const openTimePickerModal = (slotIndex: number, isStart: boolean) => {
    // Si c'est le start time et si c'est aujourd'hui, mettre à jour l'heure au créneau disponible actuel
    if (isStart && isToday(date)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Trouver le prochain créneau disponible en incréments de 30 minutes
      let nextAvailableHour = currentHour;
      let nextAvailableMinute = 0;
      
      // Arrondir à l'intervalle de 30 minutes suivant
      if (currentMinute < 30) {
        nextAvailableMinute = 30;
      } else {
        nextAvailableHour = currentHour + 1;
        nextAvailableMinute = 0;
      }
      
      // Si on passe à l'heure suivante et que c'est minuit, limiter à 23:30
      if (nextAvailableHour >= 24) {
        nextAvailableHour = 23;
        nextAvailableMinute = 30;
      }
      
      // Mettre à jour le slot avec la nouvelle heure
      const newSlots = [...slots];
      const formattedHour = nextAvailableHour.toString().padStart(2, '0');
      const formattedMinute = nextAvailableMinute.toString().padStart(2, '0');
      newSlots[slotIndex].startTime = `${formattedHour}:${formattedMinute}`;
      setSlots(newSlots);
    }
    
    setCurrentEditingSlot({ index: slotIndex, isStart });
    setShowTimePickerModal(true);
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Schedule scrolling to first available hour after the modal is visible
    setTimeout(() => {
      const firstAvailableHourIndex = getFirstAvailableHourIndex();
      
      if (firstAvailableHourIndex > 0 && hourListRef.current) {
        hourListRef.current.scrollToIndex({
          index: firstAvailableHourIndex,
          animated: true,
          viewPosition: 0
        });
      }
    }, 300);
  };

  // Handle time selection from custom picker
  const handleTimeSelection = (hour: string, minute: string) => {
    if (currentEditingSlot) {
      const { index, isStart } = currentEditingSlot;
      const formattedTime = `${hour}:${minute}`;
      const newSlots = [...slots];
      
      if (isStart) {
        // Mise à jour de l'heure de début
        newSlots[index].startTime = formattedTime;
        
        // Calcul automatique de l'heure de fin (30 minutes ou 1 heure plus tard)
        let endHour = parseInt(hour);
        let endMinute = parseInt(minute);
        
        // Par défaut, ajouter 1 heure
        if (endMinute === 0) {
          // Si on est à l'heure pile, on peut ajouter 30 minutes
          endMinute = 30;
        } else {
          // Si on est à la demi-heure, on passe à l'heure suivante
          endHour += 1;
          endMinute = 0;
        }
        
        // Gérer le cas où on dépasse minuit
        if (endHour >= 24) {
          endHour = 23;
          endMinute = 30;
        }
        
        // Formater et mettre à jour l'heure de fin
        const formattedEndHour = endHour.toString().padStart(2, '0');
        const formattedEndMinute = endMinute.toString().padStart(2, '0');
        newSlots[index].endTime = `${formattedEndHour}:${formattedEndMinute}`;
      } else {
        // Si on modifie l'heure de fin, simplement mettre à jour sans logique spéciale
        newSlots[index].endTime = formattedTime;
        
        // Vérifier que l'heure de fin est après l'heure de début
        const [startHour, startMinute] = newSlots[index].startTime.split(':').map(Number);
        const [endHour, endMinute] = formattedTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        // Si l'heure de fin est avant ou égale à l'heure de début
        if (endMinutes <= startMinutes) {
          // Calculer une nouvelle heure de fin valide (30 minutes après le début)
          let newEndHour = startHour;
          let newEndMinute = startMinute;
          
          if (newEndMinute === 0) {
            newEndMinute = 30;
          } else {
            newEndHour += 1;
            newEndMinute = 0;
          }
          
          if (newEndHour >= 24) {
            newEndHour = 23;
            newEndMinute = 30;
          }
          
          // Mettre à jour avec la nouvelle heure de fin valide
          const newFormattedEndHour = newEndHour.toString().padStart(2, '0');
          const newFormattedEndMinute = newEndMinute.toString().padStart(2, '0');
          newSlots[index].endTime = `${newFormattedEndHour}:${newFormattedEndMinute}`;
          
          // Afficher une notification pour informer l'utilisateur
          if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          
          // Informer l'utilisateur via une alerte
          setTimeout(() => {
            Alert.alert('Info', 'End time must be after start time. End time has been adjusted automatically.');
          }, 300);
        }
      }
      
      setSlots(newSlots);
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };
  
  // Handle closing the time picker modal with confirmation
  const handleTimePickerConfirm = () => {
    setShowTimePickerModal(false);
    setCurrentEditingSlot(null);
    
    // Add haptic feedback for confirmation
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  // Add a new time slot
  const addSlot = () => {
    // Vérifier si on est aujourd'hui
    if (isToday(date)) {
      // Utiliser l'heure actuelle + offset pour les nouveaux slots
      const nextTime = getNextAvailableTime();
      
      // Utiliser le dernier slot comme base
      const lastSlot = slots[slots.length - 1];
      const lastEndHour = parseInt(lastSlot.endTime.split(':')[0]);
      const lastEndMinute = parseInt(lastSlot.endTime.split(':')[1]);
      
      // Commencer à partir de l'heure de fin du dernier slot
      let newStartHour = lastEndHour;
      let newStartMinute = lastEndMinute;
      
      // Calculer l'heure de fin (1 heure après le début)
      let newEndHour = newStartHour + 1;
      let newEndMinute = newStartMinute;
      
      // Gérer le dépassement de minuit
      if (newEndHour >= 24) {
        newEndHour = 23;
        newEndMinute = 59;
      }
      
      const newStartTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`;
      const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`;
      
      setSlots([...slots, { 
        startTime: newStartTime, 
        endTime: newEndTime,
        id: Date.now().toString()
      }]);
    } else {
      // Si ce n'est pas aujourd'hui, utiliser la logique existante
      // Get the last slot's end time as the start for the new one
      const lastSlot = slots[slots.length - 1];
      const lastEndHour = parseInt(lastSlot.endTime.split(':')[0]);
      const lastEndMinute = parseInt(lastSlot.endTime.split(':')[1]);
      
      // Calculate the new slot (1 hour after the last one)
      let newStartHour = lastEndHour;
      let newStartMinute = lastEndMinute;
      let newEndHour = newStartHour + 1;
      let newEndMinute = newStartMinute;
      
      // Handle midnight rollover
      if (newEndHour >= 24) {
        newEndHour = 23;
        newEndMinute = 59;
      }
      
      const newStartTime = `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`;
      const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`;
      
      setSlots([...slots, { 
        startTime: newStartTime, 
        endTime: newEndTime,
        id: Date.now().toString()
      }]);
    }
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  // Remove a time slot
  const removeSlot = (index: number) => {
    if (slots.length === 1) {
      Alert.alert('Notice', 'You must keep at least one time slot');
      return;
    }
    
    // Add haptic feedback before showing the alert
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };
  
  // Quick date selection buttons
  const quickDateSelect = (daysToAdd: number) => {
    const newDate = addDays(new Date(), daysToAdd);
    setDate(newDate);
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Save availabilities
  const saveAvailabilities = async () => {
    // Check if any time slot is in the past
    if (isToday(date)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if any slot has a start time in the past
      const pastSlots = slots.filter(slot => {
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        
        // Check if the slot is in the past
        if (startHour < currentHour) {
          return true; // Past hour
        } else if (startHour === currentHour) {
          // For current hour, check minutes
          return startMinute === 0 ? currentMinute > 0 : currentMinute >= 30;
        }
        
        return false; // Future time
      });
      
      if (pastSlots.length > 0) {
        Alert.alert('Error', 'You cannot create availability slots in the past. Please select future time slots.');
        return;
      }
    }

    // Validate slots
    const invalidSlots = slots.filter(slot => {
      const startParts = slot.startTime.split(':');
      const endParts = slot.endTime.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      return startMinutes >= endMinutes;
    });
    
    if (invalidSlots.length > 0) {
      Alert.alert('Error', 'Start time must be earlier than end time for each slot.');
      return;
    }
    
    // Check for duplicate slots
    const uniqueSlots = new Set();
    const duplicates = slots.filter(slot => {
      const slotKey = `${slot.startTime}-${slot.endTime}`;
      if (uniqueSlots.has(slotKey)) {
        return true;
      }
      uniqueSlots.add(slotKey);
      return false;
    });
    
    if (duplicates.length > 0) {
      Alert.alert('Error', 'You have duplicate time slots. Each time slot must be unique for the day.');
      return;
    }
    
    // Check for overlapping slots
    for (let i = 0; i < slots.length - 1; i++) {
      const slot1EndParts = slots[i].endTime.split(':');
      const slot2StartParts = slots[i + 1].startTime.split(':');
      const slot1EndMinutes = parseInt(slot1EndParts[0]) * 60 + parseInt(slot1EndParts[1]);
      const slot2StartMinutes = parseInt(slot2StartParts[0]) * 60 + parseInt(slot2StartParts[1]);
      
      if (slot1EndMinutes > slot2StartMinutes) {
        Alert.alert('Error', 'Time slots cannot overlap.');
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      // Format date for the API
      const dateToSend = format(date, 'yyyy-MM-dd');
      
      // Prepare availabilities to send
      const availabilitiesToSend = slots.map(slot => ({
        date: dateToSend,
        startTime: slot.startTime,
        endTime: slot.endTime
      }));
      
      // API call to create availabilities
      await doctorAPI.createBatchAvailability(availabilitiesToSend);
      
      // Success haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Success',
        'Your availability slots have been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating availabilities:', error);
      Alert.alert('Error', 'Unable to create availability slots. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentMonth = format(date, 'MMMM yyyy');
  
  // Generate hours for the time picker
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes for the time picker
  const minutes = ['00', '30'];

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: '',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
            color: DARK_BLUE_THEME
          },
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        <ThemedText style={styles.pageTitle}>Add Availability</ThemedText>
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.calendarHeader}>
              <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
              <TouchableOpacity 
                style={styles.calendarIcon}
                onPress={() => setShowCalendarModal(true)}
              >
                <FontAwesome name="calendar" size={22} color={DARK_BLUE_THEME} />
              </TouchableOpacity>
            </View>
            
            {/* Next 7 days calendar view */}
            <ScrollView 
              ref={dayScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.daysContainer}
              contentContainerStyle={styles.daysContentContainer}
            >
              {Array.from({ length: 14 }).map((_, i) => {
                const dayDate = addDays(new Date(), i);
                const isSelected = (
                  date.getDate() === dayDate.getDate() && 
                  date.getMonth() === dayDate.getMonth() && 
                  date.getFullYear() === dayDate.getFullYear()
                );
                
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.dayCard,
                      isSelected && styles.selectedDayCard
                    ]}
                    onPress={() => {
                      setDate(dayDate);
                      
                      // Scroll to center the selected day
                      if (dayScrollRef.current) {
                        // Calculate position to scroll to (card width + margin)
                        const cardWidth = 70; // 60px width + 10px margin
                        const scrollPosition = i * cardWidth - 20; // Subtract offset to center
                        dayScrollRef.current.scrollTo({ x: scrollPosition, animated: true });
                      }
                      
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <ThemedText style={[
                      styles.dayName,
                      isSelected && styles.selectedDayText
                    ]}>
                      {format(dayDate, 'EEE')}
                    </ThemedText>
                    <View style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDayNumber
                    ]}>
                      <ThemedText style={[
                        styles.dayNumberText,
                        isSelected && styles.selectedDayNumberText
                      ]}>
                        {dayDate.getDate()}
                      </ThemedText>
                    </View>
                    <ThemedText style={[
                      styles.monthText,
                      isSelected && styles.selectedDayText
                    ]}>
                      {format(dayDate, 'MMM')}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* Selected date display */}
            <View style={styles.selectedDateContainer}>
              <FontAwesome 
                name="calendar-check-o" 
                size={18} 
                color={DARK_BLUE_THEME} 
                style={styles.selectedDateIcon} 
              />
              <ThemedText style={styles.selectedDateText}>
                {format(date, "EEEE, MMMM d, yyyy")}
              </ThemedText>
            </View>
            
            {/* Calendar modal */}
            <Modal
              visible={showCalendarModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowCalendarModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowCalendarModal(false)}
              >
                <View style={styles.calendarModalContainer}>
                  <View style={styles.calendarModalHeader}>
                    <ThemedText style={styles.calendarModalTitle}>{currentMonth}</ThemedText>
                    <View style={styles.calendarNavButtons}>
                      <TouchableOpacity style={styles.navButton}>
                        <MaterialIcons name="chevron-left" size={24} color={DARK_BLUE_THEME} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.navButton}>
                        <MaterialIcons name="chevron-right" size={24} color={DARK_BLUE_THEME} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.calendarContent}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="inline"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                      themeVariant="light"
                      accentColor={LIGHT_BLUE_ACCENT}
                      textColor={DARK_BLUE_THEME}
                    />
                  </View>
                  
                  <View style={styles.calendarModalFooter}>
                    <View style={styles.selectedDateDisplay}>
                      <ThemedText style={styles.modalDateText}>
                        {format(date, "d MMM yyyy")}
                      </ThemedText>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.doneButton}
                      onPress={handleCalendarDone}
                    >
                      <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Time Slots</ThemedText>
              <View style={styles.addSlotSection}>
                <TouchableOpacity 
                  style={styles.infoButton} 
                  onPress={() => setShowTipTooltip(!showTipTooltip)}
                >
                  <FontAwesome name="question-circle" size={18} color={DARK_BLUE_THEME} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addSlotButton} onPress={addSlot}>
                  <FontAwesome name="plus-circle" size={24} color={LIGHT_BLUE_ACCENT} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Tooltip d'information */}
             {showTipTooltip && (
               <Animated.View 
                 style={[
                   styles.tooltipContainer,
                   { opacity: tooltipOpacity }
                 ]}
               >
                 <View style={styles.tooltipArrow} />
                 <ThemedText style={styles.tooltipTitle}>Availability Guidelines:</ThemedText>
                 <View style={styles.tooltipItem}>
                   <View style={styles.bulletPoint} />
                   <ThemedText style={styles.tooltipText}>Appointments are scheduled in 30-minute slots by default</ThemedText>
                 </View>
                 <View style={styles.tooltipItem}>
                   <View style={styles.bulletPoint} />
                   <ThemedText style={styles.tooltipText}>Create multiple slots to set your working hours for the day</ThemedText>
                 </View>
                 <View style={styles.tooltipItem}>
                   <View style={styles.bulletPoint} />
                   <ThemedText style={styles.tooltipText}>Use separate slots for morning/afternoon or if you take breaks</ThemedText>
                 </View>
                 <TouchableOpacity
                   style={styles.tooltipCloseButton}
                   onPress={() => {
                     setShowTipTooltip(false);
                   }}
                 >
                   <ThemedText style={styles.tooltipCloseText}>Got it</ThemedText>
                 </TouchableOpacity>
               </Animated.View>
             )}
            
            <View style={styles.timeSlotList}>
              {slots.map((slot, index) => (
                <View key={slot.id} style={styles.slotContainer}>
                  <View style={styles.slotHeader}>
                    <ThemedText style={styles.slotHeaderText}>Slot {index + 1}</ThemedText>
                    <TouchableOpacity
                      style={styles.removeSlotButton}
                      onPress={() => removeSlot(index)}
                    >
                      <FontAwesome name="trash-o" size={18} color={DARK_BLUE_THEME} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePicker}>
                      <ThemedText style={styles.timeLabel}>Start Time</ThemedText>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => openTimePickerModal(index, true)}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="clock-o" size={16} color={DARK_BLUE_THEME} style={styles.timeIcon} />
                        <ThemedText style={styles.timeText}>{slot.startTime}</ThemedText>
                        <MaterialIcons name="arrow-drop-down" size={20} color={DARK_BLUE_THEME} style={styles.dropdownIcon} />
                      </TouchableOpacity>
                      
                      {showStartTimePicker === index && (
                        <DateTimePicker
                          value={(() => {
                            const [hours, minutes] = slot.startTime.split(':').map(Number);
                            const time = new Date();
                            time.setHours(hours, minutes, 0, 0);
                            return time;
                          })()}
                          mode="time"
                          is24Hour={true}
                          display="default"
                          onChange={(event, selectedTime) => onTimeChange(event, selectedTime, index, true)}
                        />
                      )}
                    </View>
                    
                    <MaterialIcons name="arrow-forward" size={20} color={DARK_BLUE_THEME} style={styles.arrowIcon} />
                    
                    <View style={styles.timePicker}>
                      <ThemedText style={styles.timeLabel}>End Time</ThemedText>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => openTimePickerModal(index, false)}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="clock-o" size={16} color={DARK_BLUE_THEME} style={styles.timeIcon} />
                        <ThemedText style={styles.timeText}>{slot.endTime}</ThemedText>
                        <MaterialIcons name="arrow-drop-down" size={20} color={DARK_BLUE_THEME} style={styles.dropdownIcon} />
                      </TouchableOpacity>
                      
                      {showEndTimePicker === index && (
                        <DateTimePicker
                          value={(() => {
                            const [hours, minutes] = slot.endTime.split(':').map(Number);
                            const time = new Date();
                            time.setHours(hours, minutes, 0, 0);
                            return time;
                          })()}
                          mode="time"
                          is24Hour={true}
                          display="default"
                          onChange={(event, selectedTime) => onTimeChange(event, selectedTime, index, false)}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveAvailabilities}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome name="check" size={20} color="#fff" style={styles.saveIcon} />
              <ThemedText style={styles.saveButtonText}>Save Availability</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePickerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleTimePickerConfirm}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleTimePickerConfirm}
          >
            <View style={styles.timePickerModalContainer}>
              <View style={styles.timePickerModalHeader}>
                <ThemedText style={styles.timePickerModalTitle}>
                  {currentEditingSlot?.isStart ? 'Select Start Time' : 'Select End Time'}
                </ThemedText>
                <TouchableOpacity onPress={handleTimePickerConfirm}>
                  <MaterialIcons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timePickerContent}>
                <View style={styles.timePickerColumns}>
                  <View style={styles.timePickerColumn}>
                    <ThemedText style={styles.timePickerColumnHeader}>Hour</ThemedText>
                    <View style={styles.timePickerListContainer}>
                      {isToday(date) && (
                        <View style={styles.scrollIndicator}>
                          <MaterialIcons name="keyboard-arrow-down" size={24} color="#999" />
                          {/* <ThemedText style={styles.scrollHintText}>Scroll down for available hours</ThemedText> */}
                        </View>
                      )}
                      <FlatList
                        ref={hourListRef}
                        data={hours}
                        keyExtractor={(item) => item}
                        style={styles.timePickerList}
                        showsVerticalScrollIndicator={true}
                        initialNumToRender={24}
                        onScrollToIndexFailed={(info) => {
                          // If scrolling fails, try again with a timeout
                          setTimeout(() => {
                            if (hourListRef.current) {
                              hourListRef.current.scrollToOffset({
                                offset: info.index * 44, // Approximate height of each item
                                animated: true
                              });
                            }
                          }, 100);
                        }}
                        renderItem={({ item: hour }) => {
                          const isDisabled = isHourDisabled(hour);
                          const isSelected = currentEditingSlot && 
                            slots[currentEditingSlot.index][currentEditingSlot.isStart ? 'startTime' : 'endTime'].split(':')[0] === hour;
                          return (
                            <TouchableOpacity
                              style={[
                                styles.timePickerItem,
                                isSelected && styles.selectedTimeItem,
                                isDisabled && styles.disabledTimeItem
                              ]}
                              onPress={() => {
                                if (!isDisabled && currentEditingSlot) {
                                  const [_, minutes] = slots[currentEditingSlot.index][
                                    currentEditingSlot.isStart ? 'startTime' : 'endTime'
                                  ].split(':');
                                  
                                  // Handle minute selection when hour changes
                                  const minuteIndex = getFirstAvailableMinuteIndex(parseInt(hour));
                                  const newMinute = minuteIndex >= 0 ? minutes : '00';
                                  
                                  handleTimeSelection(hour, newMinute);
                                  
                                  // Scroll to appropriate minute
                                  if (minuteIndex >= 0 && minuteListRef.current) {
                                    setTimeout(() => {
                                      minuteListRef.current?.scrollToIndex({
                                        index: minuteIndex > 0 ? minuteIndex : 0,
                                        animated: true,
                                        viewPosition: 0
                                      });
                                    }, 100);
                                  }
                                }
                              }}
                              disabled={isDisabled}
                            >
                              <ThemedText style={[
                                styles.timePickerItemText,
                                isSelected && styles.selectedTimeItemText,
                                isDisabled && styles.disabledTimeItemText
                              ]}>
                                {hour}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.timePickerColumn}>
                    <ThemedText style={styles.timePickerColumnHeader}>Minute</ThemedText>
                    <View style={styles.timePickerListContainer}>
                      <FlatList
                        ref={minuteListRef}
                        data={minutes}
                        keyExtractor={(item) => item}
                        style={styles.timePickerList}
                        showsVerticalScrollIndicator={true}
                        initialNumToRender={4}
                        renderItem={({ item: minute }) => {
                          const hourSelected = currentEditingSlot ? 
                            slots[currentEditingSlot.index][currentEditingSlot.isStart ? 'startTime' : 'endTime'].split(':')[0] : "00";
                          const isDisabled = isMinuteDisabled(minute, hourSelected);
                          const isSelected = currentEditingSlot && 
                            slots[currentEditingSlot.index][currentEditingSlot.isStart ? 'startTime' : 'endTime'].split(':')[1] === minute;
                          return (
                            <TouchableOpacity
                              style={[
                                styles.timePickerItem,
                                isSelected && styles.selectedTimeItem,
                                isDisabled && styles.disabledTimeItem
                              ]}
                              onPress={() => {
                                if (!isDisabled && currentEditingSlot) {
                                  const [hours, _] = slots[currentEditingSlot.index][
                                    currentEditingSlot.isStart ? 'startTime' : 'endTime'
                                  ].split(':');
                                  handleTimeSelection(hours, minute);
                                }
                              }}
                              disabled={isDisabled}
                            >
                              <ThemedText style={[
                                styles.timePickerItemText,
                                isSelected && styles.selectedTimeItemText,
                                isDisabled && styles.disabledTimeItemText
                              ]}>
                                {minute}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.timePickerModalFooter}>
                <TouchableOpacity 
                  style={styles.timePickerDoneButton}
                  onPress={handleTimePickerConfirm}
                >
                  <ThemedText style={styles.timePickerDoneButtonText}>Confirm</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysContentContainer: {
    paddingRight: 8,
  },
  dayCard: {
    width: 60,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  selectedDayCard: {
    backgroundColor: LIGHT_BLUE_ACCENT + '15', // Light opacity version of accent color
    borderColor: LIGHT_BLUE_ACCENT,
  },
  dayName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  selectedDayText: {
    color: DARK_BLUE_THEME,
    fontWeight: 'bold',
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  selectedDayNumber: {
    backgroundColor: LIGHT_BLUE_ACCENT,
  },
  todayCircle: {
    backgroundColor: DARK_BLUE_THEME,
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },
  todayText: {
    color: '#fff',
  },
  monthText: {
    fontSize: 12,
    color: '#666',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    marginTop: 4,
  },
  selectedDateIcon: {
    marginRight: 10,
  },
  selectedDateText: {
    fontSize: 16,
    color: DARK_BLUE_THEME,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
  },
  calendarNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 4,
    marginLeft: 12,
  },
  calendarContent: {
    padding: 8,
  },
  calendarModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  selectedDateDisplay: {
    backgroundColor: LIGHT_BLUE_ACCENT + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalDateText: {
    color: DARK_BLUE_THEME,
    fontWeight: '600',
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: LIGHT_BLUE_ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Time slots styles
  timeSlotList: {
    marginTop: 8,
  },
  slotContainer: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  slotHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_BLUE_THEME,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePicker: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'space-between',
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: DARK_BLUE_THEME,
    fontWeight: '500',
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  removeSlotButton: {
    padding: 6,
  },
  addSlotButton: {
    padding: 6,
  },
  saveButton: {
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
  saveIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedDayNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  
  // Time picker modal styles
  timePickerModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
  },
  timePickerContent: {
    padding: 16,
    maxHeight: 300,
  },
  timePickerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  timePickerColumnHeader: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  timePickerListContainer: {
    height: 220,
    position: 'relative',
  },
  scrollIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 6,
  },
  scrollHintText: {
    fontSize: 10,
    color: '#999',
    marginTop: -4,
  },
  timePickerList: {
    height: 220,
  },
  timePickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeItem: {
    backgroundColor: LIGHT_BLUE_ACCENT + '20',
  },
  disabledTimeItem: {
    opacity: 0.4,
  },
  timePickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeItemText: {
    color: LIGHT_BLUE_ACCENT,
    fontWeight: 'bold',
  },
  disabledTimeItemText: {
    color: '#999',
  },
  timePickerModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    alignItems: 'center',
  },
  timePickerDoneButton: {
    backgroundColor: LIGHT_BLUE_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  timePickerDoneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addSlotSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 6,
    marginRight: 12,
  },
  
  // Tooltip styles
  tooltipContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -10,
    right: 40,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_BLUE_THEME,
    marginBottom: 10,
  },
  tooltipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIGHT_BLUE_ACCENT,
    marginTop: 6,
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  tooltipCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: LIGHT_BLUE_ACCENT + '20',
    borderRadius: 6,
  },
  tooltipCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: LIGHT_BLUE_ACCENT,
  },
}); 