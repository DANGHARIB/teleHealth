import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// URL de base de l'API depuis les variables d'environnement
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.106:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fonctions d'API
export const authAPI = {
  // Inscription
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Connexion
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Récupérer le profil utilisateur
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// API pour les médecins
export const doctorAPI = {
  // Récupérer tous les médecins
  getDoctors: async () => {
    try {
      const response = await api.get('/doctors');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Rechercher des médecins par nom
  searchDoctors: async (query) => {
    try {
      const response = await api.get(`/doctors?search=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtenir un médecin par ID
  getDoctorById: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer le profil du médecin
  getProfile: async () => {
    try {
      const response = await api.get('/doctors/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les patients qui ont sauvegardé le médecin
  getSavedPatients: async () => {
    try {
      const response = await api.get('/doctors/saved-patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Rechercher parmi les patients qui ont sauvegardé le médecin
  searchSavedPatients: async (query) => {
    try {
      const response = await api.get(`/doctors/search-patients?search=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les disponibilités du médecin connecté
  getMyAvailability: async (date) => {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await api.get(`/availability/my-availability${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les rendez-vous du médecin
  getAppointments: async (status) => {
    try {
      const queryParams = status ? `?status=${status}` : '';
      const response = await api.get(`/appointments/doctor/me${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer un rendez-vous par ID
  getAppointmentById: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les paiements du médecin
  getPayments: async () => {
    try {
      const response = await api.get('/payments/doctor');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Mettre à jour le statut d'un rendez-vous
  updateAppointmentStatus: async (appointmentId, statusData) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Confirmer un rendez-vous et générer un lien zoom
  confirmAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/${appointmentId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Demander une reprogrammation d'un rendez-vous (envoie une notification au patient)
  requestRescheduleAppointment: async (appointmentId) => {
    try {
      const response = await api.post(`/appointments/${appointmentId}/request-reschedule`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Créer une disponibilité
  createAvailability: async (availabilityData) => {
    try {
      const response = await api.post('/availability', availabilityData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Créer plusieurs disponibilités à la fois
  createBatchAvailability: async (availabilities) => {
    try {
      const response = await api.post('/availability/batch', { availabilities });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Mettre à jour une disponibilité
  updateAvailability: async (id, availabilityData) => {
    try {
      const response = await api.put(`/availability/${id}`, availabilityData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Supprimer une disponibilité
  deleteAvailability: async (id) => {
    try {
      const response = await api.delete(`/availability/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// API pour les patients
export const patientAPI = {
  // Récupérer le profil du patient
  getProfile: async () => {
    try {
      const response = await api.get('/patients/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mettre à jour le profil du patient
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/patients/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Récupérer les médecins sauvegardés
  getSavedDoctors: async () => {
    try {
      const response = await api.get('/patients/saved-doctors');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Sauvegarder un médecin
  saveDoctor: async (doctorId) => {
    try {
      const response = await api.post(`/patients/save-doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Supprimer un médecin sauvegardé
  removeSavedDoctor: async (doctorId) => {
    try {
      const response = await api.delete(`/patients/save-doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les disponibilités d'un médecin
  getDoctorAvailability: async (doctorId, date) => {
    try {
      const queryParams = date ? `?date=${date}&isBooked=false` : '?isBooked=false';
      const response = await api.get(`/availability/doctor/${doctorId}${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Créer un rendez-vous
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Création d'un paiement
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer les paiements du patient
  getPayments: async () => {
    try {
      const response = await api.get('/payments/patient');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer un paiement par ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Récupérer les rendez-vous du patient
  getAppointments: async (status) => {
    try {
      const queryParams = status ? `?status=${status}` : '';
      const response = await api.get(`/appointments/patient/me${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Annuler un rendez-vous
  cancelAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reprogrammer un rendez-vous par le patient
  rescheduleAppointment: async (appointmentId, rescheduleData) => {
    try {
      // Note: rescheduleData should contain { newAvailabilityId, newSlotStartTime, newSlotEndTime }
      const response = await api.put(`/appointments/${appointmentId}/patient-reschedule`, rescheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Récupérer les médecins recommandés
  getRecommendedDoctors: async () => {
    try {
      const response = await api.get('/patients/recommended-doctors');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Récupérer les méthodes de paiement sauvegardées
  getSavedPaymentMethods: async () => {
    try {
      const response = await api.get('/payment-methods');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Ajouter une nouvelle méthode de paiement
  addPaymentMethod: async (paymentMethodData) => {
    try {
      const response = await api.post('/payment-methods', paymentMethodData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Définir une méthode de paiement comme défaut
  setDefaultPaymentMethod: async (paymentMethodId) => {
    try {
      const response = await api.put(`/payment-methods/${paymentMethodId}/default`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Supprimer une méthode de paiement
  deletePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await api.delete(`/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Test de connexion API
export const testAPI = {
  ping: async () => {
    try {
      const response = await api.get('/ping');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// API pour les notifications
export const notificationsAPI = {
  // Récupérer toutes les notifications de l'utilisateur
  getNotifications: async (page = 1, limit = 20, readStatus) => {
    try {
      let queryParams = `?page=${page}&limit=${limit}`;
      if (readStatus !== undefined) {
        queryParams += `&read=${readStatus}`;
      }
      
      const response = await api.get(`/notifications${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Récupérer le nombre de notifications non lues
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Marquer une notification comme lue
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Supprimer une notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Supprimer toutes les notifications
  clearAllNotifications: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Créer une notification de test (admin uniquement)
  createTestNotification: async (data) => {
    try {
      const response = await api.post('/notifications/test', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;
