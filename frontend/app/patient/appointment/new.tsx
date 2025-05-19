import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  addDays,
  parseISO,
  isToday,
  isTomorrow,
  isFuture,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameWeek,
  isBefore,
  addMinutes,
  parse,
} from "date-fns";
import { enUS } from "date-fns/locale";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { doctorAPI, patientAPI } from "@/services/api";

// API URL constants
const API_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000/api";
const BASE_SERVER_URL = API_URL.replace("/api", "");

// Helper function to convert image paths into proper URLs
const getImageUrl = (imagePath: string | undefined): string | undefined => {
  if (!imagePath || imagePath.trim() === "") return undefined;

  // Handle both absolute paths (from older records) and relative paths
  if (
    imagePath.startsWith("C:") ||
    imagePath.startsWith("/") ||
    imagePath.startsWith("\\")
  ) {
    // For absolute paths, extract just the filename
    const fileName = imagePath.split(/[\\\/]/).pop();
    return `${BASE_SERVER_URL}/uploads/${fileName}`;
  } else {
    // For proper relative paths
    return `${BASE_SERVER_URL}${imagePath.replace(/\\/g, "/")}`;
  }
};

const { width } = Dimensions.get("window");

// Constants for scroll calculation
const DATE_OPTION_WIDTH = 56;
const DATE_OPTION_MARGIN = 12;
const DATE_SELECTOR_PADDING = 16;
const APPOINTMENT_DURATION = 30; // Appointment duration in minutes

const COLORS = {
  primary: "#7AA7CC",
  primaryLight: "#8FB5D5",
  primaryDark: "#6999BE",
  secondary: "#F8FAFC",
  accent: "#7AA7CC", // Same as primary, used for consistency with [id].tsx
  warning: "#F59E0B",
  danger: "#EF4444",
  success: "#22C55E",
  purple: "#8B5CF6",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#090F47", // Dark navy for text, inspired by [id].tsx
  white: "#FFFFFF",
  background: "#FAFBFE",
};

// Types
type Doctor = {
  _id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  doctor_image?: string;
  experience: number;
  price?: number;
  rating?: number;
};

type TimeSlot = {
  _id: string;
  availabilityId: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

type DateOption = {
  date: Date;
  formattedDate: string;
  dayName: string;
  dayNumber: string;
  hasAvailabilities: boolean;
};

// Function to convert time in HH:MM format to minutes
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// Function to convert minutes to HH:MM format
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export default function BookAppointmentScreen() {
  const { doctorId, appointmentIdToReschedule } = useLocalSearchParams< { doctorId: string; appointmentIdToReschedule?: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);

  // Week navigation
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [dateOptions, setDateOptions] = useState<Date[]>([]);

  // Ref for date selector ScrollView
  const dateScrollViewRef = useRef<ScrollView>(null);

  // New state to track loading of available dates
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);

  // Generate date options for the current week
  useEffect(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
    const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setDateOptions(dates);

    // Check which dates have availabilities
    checkAvailableDates(dates);
  }, [currentWeek]);

  // Check which dates of the week have availabilities
  const checkAvailableDates = async (dates: Date[]) => {
    if (!doctorId) return;

    try {
      setLoadingAvailableDates(true);

      // Extract formatted dates for the API
      const formattedDates = dates.map((date) => format(date, "yyyy-MM-dd"));

      // Retrieve availabilities for the entire week in a single request
      // Note: this would require a backend update to accept an array of dates
      // For now, we'll make one call per day, but group them in Promise.all
      const availabilitiesPromises = formattedDates.map((date) =>
        patientAPI.getDoctorAvailability(doctorId as string, date),
      );

      const availabilitiesResults = await Promise.all(availabilitiesPromises);

      const availableDatesOptions: DateOption[] = dates.map((date, index) => ({
        date,
        formattedDate: formattedDates[index],
        dayName: format(date, "EEE", { locale: enUS }),
        dayNumber: format(date, "d"),
        hasAvailabilities: availabilitiesResults[index].length > 0,
      }));

      setAvailableDates(availableDatesOptions);
    } catch (err) {
      console.error("Error checking available dates:", err);
    } finally {
      setLoadingAvailableDates(false);
    }
  };

  // Load doctor details
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        if (!doctorId) return;

        setLoading(true);
        const doctorData = await doctorAPI.getDoctorById(doctorId as string);
        setDoctor(doctorData);

        // Once doctor details are loaded, load slots for the selected date
        await fetchAvailabilities(format(selectedDate, "yyyy-MM-dd"));

        setLoading(false);
      } catch (err) {
        console.error("Error loading doctor details:", err);
        setError("Unable to load doctor details");
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  // Retrieve 30-minute time slots for a specific date
  const fetchAvailabilities = async (date: string) => {
    try {
      setLoadingSlots(true);
      setSelectedTimeSlot(null); // Reset selection when date changes

      // This API call will now return an array of TimeSlot objects
      const timeSlotsData = await patientAPI.getDoctorAvailability(
        doctorId as string,
        date,
      );
      setTimeSlots(timeSlotsData);

      setLoadingSlots(false);
    } catch (err) {
      console.error("Error loading time slots:", err);
      setTimeSlots([]); // Clear slots on error
      setLoadingSlots(false);
    }
  };

  // Navigation functions for weeks
  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    const today = new Date();

    // Don't allow navigation before the current week
    if (
      isBefore(newWeek, today) &&
      !isSameWeek(newWeek, today, { weekStartsOn: 1 })
    ) {
      return;
    }

    // Check if the new week is the current week
    if (isSameWeek(newWeek, today, { weekStartsOn: 1 })) {
      // For the current week, select today
      setCurrentWeek(newWeek);
      setSelectedDate(today);
    } else {
      // For other weeks, select Monday
      const mondayOfNewWeek = startOfWeek(newWeek, { weekStartsOn: 1 });
      setCurrentWeek(newWeek);
      setSelectedDate(mondayOfNewWeek);
    }
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const today = new Date();

    // Check if the new week is the current week
    if (isSameWeek(newWeek, today, { weekStartsOn: 1 })) {
      // For the current week, select today
      setCurrentWeek(newWeek);
      setSelectedDate(today);
    } else {
      // For other weeks, select Monday
      const mondayOfNewWeek = startOfWeek(newWeek, { weekStartsOn: 1 });
      setCurrentWeek(newWeek);
      setSelectedDate(mondayOfNewWeek);
    }
  };

  const goToCurrentWeek = () => {
    // For the current week, always select today
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  };

  // Auto-scroll to selected date
  const scrollToSelectedDate = (targetDate: Date) => {
    const selectedIndex = dateOptions.findIndex(
      (date) => format(date, "yyyy-MM-dd") === format(targetDate, "yyyy-MM-dd"),
    );

    if (selectedIndex > -1 && dateScrollViewRef.current) {
      // Calculate scroll position to center the selected date or show upcoming days
      const scrollX = Math.max(
        0,
        selectedIndex * (DATE_OPTION_WIDTH + DATE_OPTION_MARGIN) -
          DATE_SELECTOR_PADDING,
      );

      dateScrollViewRef.current.scrollTo({
        x: scrollX,
        animated: true,
      });
    }
  };

  // Handle date selection with auto-scroll
  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    // Retrieve availabilities for the new date
    fetchAvailabilities(format(date, "yyyy-MM-dd"));
    scrollToSelectedDate(date);
  };

  // Effect to auto-scroll when selectedDate changes (including week changes)
  useEffect(() => {
    if (dateOptions.length > 0) {
      // Delay the scroll to ensure the ScrollView is rendered
      setTimeout(() => {
        scrollToSelectedDate(selectedDate);
      }, 100);
    }
  }, [dateOptions, selectedDate]);

  // Initialization: select current date on load
  useEffect(() => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  }, []);

  // Select a time slot
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    // Utiliser l'ID unique du créneau pour la sélection dans l'UI
    setSelectedTimeSlot(slot._id);
  };

  // Format time for display with time range (e.g., 8:00-8:30 AM)
  const formatTimeForDisplay = (startTime: string, endTime: string): string => {
    const formatSingleTime = (time: string): string => {
      const [hours, minutes] = time.split(":");
      let formattedHours = parseInt(hours);
      const ampm = formattedHours >= 12 ? "PM" : "AM";

      if (formattedHours > 12) {
        formattedHours -= 12;
      } else if (formattedHours === 0) {
        formattedHours = 12;
      }

      return `${formattedHours}:${minutes}`;
    };

    const startFormatted = formatSingleTime(startTime);
    const endFormatted = formatSingleTime(endTime);

    // If both times are in the same period (AM/PM), only show AM/PM once
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const samePeriod =
      (startHour < 12 && endHour < 12) || (startHour >= 12 && endHour >= 12);

    if (samePeriod) {
      const period = endHour >= 12 ? "PM" : "AM";
      return `${startFormatted}-${endFormatted} ${period}`;
    } else {
      const startPeriod = startHour >= 12 ? "PM" : "AM";
      const endPeriod = endHour >= 12 ? "PM" : "AM";
      return `${startFormatted} ${startPeriod}-${endFormatted} ${endPeriod}`;
    }
  };

  // Book the appointment
  const handleBookAppointment = async () => {
    if (!selectedTimeSlot || !doctorId || !doctor) {
      Alert.alert("Error", "Please select a date and time, or doctor details are missing.");
      return;
    }

    try {
      const selectedSlot = timeSlots.find((slot) => slot._id === selectedTimeSlot);

      if (!selectedSlot) {
        Alert.alert("Error", "Selected time slot not found.");
        return;
      }

      if (appointmentIdToReschedule) {
        // This is a reschedule request
        const rescheduleData = {
          newAvailabilityId: selectedSlot.availabilityId, // The ID of the general availability block
          newSlotStartTime: selectedSlot.startTime,
          newSlotEndTime: selectedSlot.endTime,
          price: doctor.price || 28, // Price might need re-evaluation or carry-over
          duration: APPOINTMENT_DURATION,
        };
        
        console.log("Attempting to reschedule appointment:", appointmentIdToReschedule, "with data:", rescheduleData);
        const rescheduledAppointment = await patientAPI.rescheduleAppointment(appointmentIdToReschedule as string, rescheduleData);
        
        Alert.alert(
          "Appointment Rescheduled",
          `Your appointment has been successfully rescheduled for ${format(selectedDate, "MMM dd, yyyy")} at ${formatTimeForDisplay(selectedSlot.startTime, selectedSlot.endTime)}. Payment status remains unchanged.`,
          [
            {
              text: "OK",
              onPress: () => router.replace('/(patient)/(tabs)/appointment'), // Navigate to appointments list
            },
          ]
        );

      } else {
        // This is a new booking
        const appointmentData = {
          doctorId: doctorId,
          availabilityId: selectedSlot.availabilityId,
          slotStartTime: selectedSlot.startTime,
          slotEndTime: selectedSlot.endTime,
          price: doctor.price || 28,
          duration: APPOINTMENT_DURATION,
          caseDetails: "Standard consultation",
        };

        const createdAppointment = await patientAPI.createAppointment(appointmentData);

        // Informer l'utilisateur qu'il doit finaliser le paiement
        Alert.alert(
          "Réservation en attente",
          "Votre réservation est en attente de paiement. Veuillez finaliser le paiement pour confirmer votre rendez-vous.",
          [
            { 
              text: "Continuer vers le paiement", 
              onPress: () => {
                router.push({
                  pathname: "/patient/payment",
                  params: { appointmentId: createdAppointment._id },
                });
              } 
            }
          ]
        );
      }
    } catch (err: any) { // Type err as any to safely access potential properties
      let coreMessage = "An unexpected error occurred.";
      let isHandledError = false;

      // Attempt to extract the message from common error structures
      if (err && err.message && typeof err.message === 'string') {
        // Covers cases where err is { message: "actual string" } or an Error instance
        coreMessage = err.message;
      } else if (typeof err === 'string') {
        // Covers cases where err itself is the message string
        coreMessage = err;
      } else if (typeof err === 'object' && err !== null) {
        // Fallback for other object structures, stringify it
        coreMessage = JSON.stringify(err);
      }

      // Log the raw error details in development for debugging, but not for specifically handled user errors if we want to suppress the toast for them.
      // The toast is likely triggered by console.error in dev environments.

      // Now check the coreMessage for specific known error strings
      if (coreMessage.includes("Vous avez déjà un rendez-vous avec ce médecin pour cette date")) {
        Alert.alert(
          "Appointment Already Booked",
          "You already have an appointment with this doctor on the selected date. Please choose a different date or doctor.",
          [{ text: "OK", style: "default" }]
        );
        isHandledError = true;
      } else if (coreMessage.includes("Ce créneau spécifique de 30 minutes est déjà réservé")) {
        Alert.alert(
          "Time Slot Unavailable",
          "This time slot is no longer available. Please select a different time.",
          [{ text: "OK", style: "default" }]
        );
        isHandledError = true;
      } else if (
        coreMessage.includes("Erreur serveur lors de la création du rendez-vous") ||
        coreMessage.includes("duplicate") || // General duplicate error
        coreMessage.includes("already booked") // General already booked error
      ) {
        Alert.alert(
          "Booking Conflict",
          "There was an issue with your booking. This time may no longer be available or you might already have a booking. Please try a different time slot or date.",
          [{ text: "OK", style: "default" }]
        );
        isHandledError = true;
      } else {
        Alert.alert(
          "Booking Failed",
          "Unable to book appointment. Please try again or choose a different time slot.",
          [{ text: "OK", style: "default" }]
        );
      }

      // Only use console.error for unhandled/unexpected errors in development
      if (!isHandledError && process.env.NODE_ENV !== 'production') {
        console.error("Error booking appointment (unhandled):", err);
      } else if (isHandledError && process.env.NODE_ENV !== 'production') {
        // For handled errors, use console.log if you still want to see them in dev without the aggressive red toast
        console.log("Handled booking error:", coreMessage, "Raw error:", err);
      }
    }
  };

  // Get default image if doctor's image is not available
  const getDefaultImage = () => require("@/assets/images/icon.png");

  // Get doctor's full name
  const getDoctorName = (doctor: Doctor) => {
    if (doctor.full_name) return doctor.full_name;
    return `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim();
  };

  // Render rating stars
  const renderRatingStars = (rating: number = 4) => {
    const stars = [];
    const maxStars = 5;

    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={20}
          color="#FFD700"
        />,
      );
    }

    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  // Check if current week is this week
  const isCurrentWeek = isSameWeek(currentWeek, new Date(), {
    weekStartsOn: 1,
  });

  // Render week navigation header
  const renderWeekNavigation = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekRange = `${format(weekStart, "MMM dd")} - ${format(
      weekEnd,
      "MMM dd, yyyy",
    )}`;

    const isPrevDisabled = 
      isBefore(subWeeks(currentWeek, 1), new Date()) &&
      !isSameWeek(subWeeks(currentWeek, 1), new Date(), { weekStartsOn: 1 });

    return (
      <View style={styles.weekNavigationContainer}>
        <TouchableOpacity
          style={[
            styles.weekNavButton,
            isPrevDisabled && styles.disabledButton,
          ]}
          onPress={goToPreviousWeek}
          disabled={isPrevDisabled}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={isPrevDisabled ? COLORS.gray300 : COLORS.primary} 
          />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <TouchableOpacity
            style={styles.weekRangeButton}
            onPress={goToCurrentWeek}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.primary}
            />
            <ThemedText style={styles.weekRangeText}>{weekRange}</ThemedText>
            {!isCurrentWeek && (
              <View style={styles.currentWeekIndicator}>
                <ThemedText style={styles.currentWeekText}>
                  Current Week
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.weekNavButton} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render date selection
  const renderDateSelector = () => {
    return (
      <View style={styles.dateSelectorContainer}>
        {loadingAvailableDates ? (
          <View style={styles.dateLoaderContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <ThemedText style={styles.dateLoaderText}>
              Loading availabilities...
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            ref={dateScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelector}
          >
            {dateOptions.map((date, index) => {
              const isSelected =
                format(selectedDate, "yyyy-MM-dd") ===
                format(date, "yyyy-MM-dd");
              const isToday =
                format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              // Check if this date has availabilities
              const dateOption = availableDates.find(
                (d) =>
                  format(d.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
              );
              const hasAvailabilities = dateOption?.hasAvailabilities || false;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateOption,
                    isSelected && styles.selectedDateOption,
                    !hasAvailabilities && styles.unavailableDateOption,
                  ]}
                  onPress={() => hasAvailabilities && handleDateSelection(date)}
                  disabled={!hasAvailabilities}
                >
                  <ThemedText
                    style={[
                      styles.dayName,
                      isSelected && styles.selectedDateText,
                      !hasAvailabilities && styles.unavailableDateText,
                    ]}
                  >
                    {format(date, "EEE", { locale: enUS })}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDateText,
                      !hasAvailabilities && styles.unavailableDateText,
                    ]}
                  >
                    {format(date, "dd")}
                  </ThemedText>
                  {isToday && !isSelected && (
                    <View style={styles.todayIndicator} />
                  )}
                  {!hasAvailabilities && (
                    <View style={styles.noAvailabilityIndicator}>
                      <Ionicons name="close" size={12} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  // Render time slots grid
  const renderTimeSlots = () => {
    if (loadingSlots) {
      return (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.slotLoader}
        />
      );
    }

    if (timeSlots.length === 0) {
      return (
        <ThemedText style={styles.noSlotsText}>
          No available slots for this date
        </ThemedText>
      );
    }

    // Group slots by time of day
    const morningSlots = timeSlots.filter((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0]);
      return hour < 12;
    });

    const afternoonSlots = timeSlots.filter((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0]);
      return hour >= 12 && hour < 17;
    });

    const eveningSlots = timeSlots.filter((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0]);
      return hour >= 17;
    });

    return (
      <View style={styles.timeSlotsContainer}>
        {morningSlots.length > 0 && (
          <View style={styles.timeSlotSection}>
            <View style={styles.timeSlotSectionHeader}>
              <Ionicons name="sunny-outline" size={18} color={COLORS.warning} />
              <ThemedText style={styles.timeSlotSectionTitle}>
                Morning
              </ThemedText>
            </View>
            <View style={styles.timeGrid}>
              {morningSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`morning-${index}`}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot._id && styles.selectedTimeSlot,
                    !slot.available && styles.unavailableTimeSlot,
                  ]}
                  onPress={() => slot.available && handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  {selectedTimeSlot === slot._id && (
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={styles.selectedIcon} />
                  )}
                  <ThemedText
                    style={[
                      styles.timeText,
                      selectedTimeSlot === slot._id && styles.selectedTimeText,
                      !slot.available && styles.unavailableTimeText,
                    ]}
                  >
                    {formatTimeForDisplay(slot.startTime, slot.endTime)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {afternoonSlots.length > 0 && (
          <View style={styles.timeSlotSection}>
            <View style={styles.timeSlotSectionHeader}>
              <Ionicons
                name="partly-sunny-outline"
                size={18}
                color={COLORS.primary}
              />
              <ThemedText style={styles.timeSlotSectionTitle}>
                Afternoon
              </ThemedText>
            </View>
            <View style={styles.timeGrid}>
              {afternoonSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`afternoon-${index}`}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot._id && styles.selectedTimeSlot,
                    !slot.available && styles.unavailableTimeSlot,
                  ]}
                  onPress={() => slot.available && handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  {selectedTimeSlot === slot._id && (
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={styles.selectedIcon} />
                  )}
                  <ThemedText
                    style={[
                      styles.timeText,
                      selectedTimeSlot === slot._id && styles.selectedTimeText,
                      !slot.available && styles.unavailableTimeText,
                    ]}
                  >
                    {formatTimeForDisplay(slot.startTime, slot.endTime)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {eveningSlots.length > 0 && (
          <View style={styles.timeSlotSection}>
            <View style={styles.timeSlotSectionHeader}>
              <Ionicons name="moon-outline" size={18} color={COLORS.purple} />
              <ThemedText style={styles.timeSlotSectionTitle}>
                Evening
              </ThemedText>
            </View>
            <View style={styles.timeGrid}>
              {eveningSlots.map((slot, index) => (
                <TouchableOpacity
                  key={`evening-${index}`}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot._id && styles.selectedTimeSlot,
                    !slot.available && styles.unavailableTimeSlot,
                  ]}
                  onPress={() => slot.available && handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  {selectedTimeSlot === slot._id && (
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={styles.selectedIcon} />
                  )}
                  <ThemedText
                    style={[
                      styles.timeText,
                      selectedTimeSlot === slot._id && styles.selectedTimeText,
                      !slot.available && styles.unavailableTimeText,
                    ]}
                  >
                    {formatTimeForDisplay(slot.startTime, slot.endTime)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Book Appointment",
          headerShown: true,
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
            color: COLORS.gray900,
          },
        }}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      ) : error ? (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : doctor ? (
        <ScrollView style={styles.container}>
          {/* Doctor card */}
          <ThemedView style={styles.doctorCard}>
            <View style={styles.doctorProfile}>
              {doctor.doctor_image ? (
                <Image
                  source={{ uri: getImageUrl(doctor.doctor_image) }}
                  style={styles.doctorImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.doctorImage, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={32} color={COLORS.white} />
                </View>
              )}

              <View style={styles.doctorInfo}>
                <ThemedText type="title" style={styles.doctorName}>
                  Dr. {getDoctorName(doctor)}
                </ThemedText>

                {renderRatingStars(doctor.rating)}

                <ThemedText style={styles.priceText}>
                  ${doctor.price ? doctor.price.toFixed(2) : "28.00"} / session
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.experienceText}>
              {doctor.experience} years of experience
            </ThemedText>
          </ThemedView>

          {/* Week navigation */}
          {renderWeekNavigation()}

          {/* Date selection */}
          {renderDateSelector()}

          {/* Time selection */}
          <ThemedView style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Choose a time
            </ThemedText>

            {renderTimeSlots()}
          </ThemedView>

          {/* Book button */}
          <TouchableOpacity
            style={[
              styles.bookButton,
              (!selectedDate || !selectedTimeSlot) && styles.disabledButton,
            ]}
            onPress={handleBookAppointment}
            disabled={!selectedDate || !selectedTimeSlot}
          >
            <ThemedText style={styles.bookButtonText}>
              {appointmentIdToReschedule ? "Reschedule Appointment" : "Book Appointment"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>Doctor not found</ThemedText>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slotLoader: {
    margin: 20,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
  doctorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorProfile: {
    flexDirection: "row",
    marginBottom: 15,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  doctorImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F4F4F4",
  },
  doctorName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.gray900,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  priceText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  experienceText: {
    fontSize: 16,
    color: COLORS.gray600,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gray900,
    marginBottom: 10,
  },
  timeSlotsContainer: {
    marginTop: 5,
  },
  timeSlotSection: {
    marginBottom: 20,
  },
  timeSlotSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  timeSlotSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray800,
    marginLeft: 8,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  timeSlot: {
    width: "31%",
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
    justifyContent: 'center',
    minHeight: 60,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unavailableTimeSlot: {
    backgroundColor: COLORS.gray200,
    borderColor: COLORS.gray300,
    opacity: 0.6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray700,
    textAlign: "center",
  },
  selectedTimeText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  unavailableTimeText: {
    color: COLORS.gray400,
    textDecorationLine: 'line-through',
  },
  noSlotsText: {
    textAlign: "center",
    color: COLORS.gray500,
    marginVertical: 20,
    fontStyle: "italic",
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    margin: 16,
    marginTop: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.gray400,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  // Styles for week navigation and date selection
  weekNavigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  weekInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  weekRangeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}05`,
    position: "relative",
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray800,
    marginLeft: 8,
  },
  currentWeekIndicator: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentWeekText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  dateSelectorContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dateSelector: {
    paddingVertical: 16,
    paddingHorizontal: DATE_SELECTOR_PADDING,
  },
  dateOption: {
    width: DATE_OPTION_WIDTH,
    height: 70,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DATE_OPTION_MARGIN,
    position: "relative",
  },
  selectedDateOption: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  unavailableDateOption: {
    backgroundColor: COLORS.gray200,
    opacity: 0.7,
  },
  dayName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray500,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  selectedDateText: {
    color: COLORS.white,
  },
  unavailableDateText: {
    color: COLORS.gray500,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray700,
  },
  todayIndicator: {
    position: "absolute",
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
  },
  noAvailabilityIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gray400,
    justifyContent: "center",
    alignItems: "center",
  },
  dateLoaderContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray600,
  },
  selectedIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
