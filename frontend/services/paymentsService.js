import api from './api';
import { doctorAPI, patientAPI, adminAPI } from './api';

/**
 * Service de gestion des paiements pour l'application mobile
 */

/**
 * Transformer les données de paiement de l'API vers le format de l'interface utilisateur
 * @param {Object} apiPayment - Paiement provenant de l'API
 * @returns {Object} - Paiement formaté pour l'UI
 */
const transformPaymentData = (apiPayment) => {
  return {
    id: apiPayment._id,
    amount: apiPayment.amount || 0,
    date: apiPayment.paymentDate || apiPayment.createdAt,
    status: apiPayment.status || 'pending',
    method: apiPayment.paymentMethod,
    methodDisplay: formatPaymentMethod(apiPayment.paymentMethod),
    description: apiPayment.appointment?.caseDetails || 'Consultation',
    
    // Relations
    doctor: apiPayment.appointment?.doctor ? {
      id: apiPayment.appointment.doctor._id,
      name: apiPayment.appointment.doctor.full_name || 
        `${apiPayment.appointment.doctor.first_name || ''} ${apiPayment.appointment.doctor.last_name || ''}`.trim()
    } : null,
    
    patient: apiPayment.patient ? {
      id: apiPayment.patient._id,
      name: `${apiPayment.patient.first_name || ''} ${apiPayment.patient.last_name || ''}`.trim()
    } : null,
    
    appointment: apiPayment.appointment ? {
      id: apiPayment.appointment._id,
      date: apiPayment.appointment.availability?.date,
      time: apiPayment.appointment.slotStartTime
    } : null,
    
    // Métadonnées
    transactionId: apiPayment.transactionId,
    createdAt: apiPayment.createdAt,
    updatedAt: apiPayment.updatedAt,
    
    // Données originales
    _original: apiPayment
  };
};

/**
 * Formater la méthode de paiement pour l'affichage
 * @param {string} method - Code de la méthode de paiement
 * @returns {string} - Nom d'affichage de la méthode
 */
const formatPaymentMethod = (method) => {
  const methods = {
    'card': 'Carte bancaire',
    'paypal': 'PayPal',
    'apple_pay': 'Apple Pay',
    'google_pay': 'Google Pay'
  };
  
  return methods[method] || method || 'Carte bancaire';
};

const paymentsService = {
  /**
   * Récupérer tous les paiements d'un patient (pour l'utilisateur connecté)
   * @returns {Promise<Array>} Liste des paiements
   */
  getPatientPayments: async () => {
    try {
      console.log('🔍 Récupération des paiements du patient...');
      const payments = await patientAPI.getPayments();
      console.log(`✅ ${payments.length} paiements récupérés`);
      
      return payments.map(payment => transformPaymentData(payment));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer tous les paiements d'un médecin (pour l'utilisateur connecté)
   * @returns {Promise<Array>} Liste des paiements
   */
  getDoctorPayments: async () => {
    try {
      console.log('🔍 Récupération des paiements du médecin...');
      const payments = await doctorAPI.getPayments();
      console.log(`✅ ${payments.length} paiements récupérés`);
      
      return payments.map(payment => transformPaymentData(payment));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  },
  
  /**
   * Récupérer les détails d'un paiement par son ID
   * @param {string} id - ID du paiement
   * @returns {Promise<Object>} Détails du paiement
   */
  getPaymentById: async (id) => {
    try {
      console.log(`🔍 Récupération du paiement ${id}...`);
      const payment = await doctorAPI.getPaymentById(id);
      console.log('✅ Paiement récupéré');
      
      return transformPaymentData(payment);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du paiement ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Créer un paiement pour un rendez-vous
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} Paiement créé
   */
  createPaymentWithAppointment: async (paymentData) => {
    try {
      console.log('🔍 Création du paiement avec rendez-vous...');
      const result = await patientAPI.createPaymentWithAppointment(paymentData);
      console.log('✅ Paiement et rendez-vous créés');
      
      return {
        appointment: result.appointment,
        payment: transformPaymentData(result.payment)
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du paiement avec rendez-vous:', error);
      throw error;
    }
  }
};

export default paymentsService; 