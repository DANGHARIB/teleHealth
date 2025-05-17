const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const notificationService = require('./notificationService');

/**
 * Service de gestion des paiements 
 * Ce service gère les paiements, remboursements et transactions financières
 */

// Effectuer un remboursement partiel (80%) lors de l'annulation d'un rendez-vous
exports.processPartialRefund = async (appointmentId) => {
  try {
    // Trouver le rendez-vous
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Rendez-vous non trouvé');
    }
    
    // Vérifier que le rendez-vous a été payé
    if (appointment.paymentStatus !== 'completed') {
      throw new Error('Ce rendez-vous n\'a pas encore été payé');
    }
    
    // Rechercher le paiement associé au rendez-vous
    const payment = await Payment.findOne({ appointment: appointmentId });
    if (!payment) {
      throw new Error('Paiement non trouvé pour ce rendez-vous');
    }
    
    // Calculer le montant du remboursement (80%)
    const refundAmount = payment.amount * 0.8;
    const penaltyAmount = payment.amount * 0.2;
    
    // Simuler un remboursement partiel
    // Dans un système réel, nous ferions un appel à un service de paiement externe
    console.log(`Remboursement partiel (80%) de ${refundAmount}€ pour le rendez-vous ${appointmentId}`);
    
    // Créer un nouveau paiement pour le remboursement
    const refundPayment = new Payment({
      appointment: appointmentId,
      patient: payment.patient,
      amount: -refundAmount, // Montant négatif pour indiquer un remboursement
      paymentMethod: payment.paymentMethod,
      status: 'refunded',
      transactionId: `refund_${payment.transactionId}`
    });
    
    await refundPayment.save();
    
    // Mettre à jour le statut du paiement original
    payment.status = 'refunded';
    await payment.save();
    
    // Mettre à jour le statut de paiement du rendez-vous (utiliser un nouveau statut spécifique)
    appointment.paymentStatus = 'refunded';
    await appointment.save();
    
    // Envoyer une notification au patient
    const patient = await Patient.findById(payment.patient).populate('user');
    if (patient && patient.user) {
      await notificationService.sendNotification(
        patient.user._id,
        'Remboursement partiel',
        `Vous avez été remboursé de ${refundAmount}€ (80%) pour votre rendez-vous annulé. Une pénalité de ${penaltyAmount}€ (20%) a été retenue.`,
        { appointmentId, type: 'partial_refund' }
      );
    }
    
    // Envoyer une notification au médecin
    const doctor = await Doctor.findById(appointment.doctor).populate('user');
    if (doctor && doctor.user) {
      await notificationService.sendNotification(
        doctor.user._id,
        'Pénalité d\'annulation conservée',
        `Une pénalité d'annulation de ${penaltyAmount}€ (20%) a été conservée pour le rendez-vous annulé.`,
        { appointmentId, type: 'penalty_retained' }
      );
    }
    
    return {
      success: true,
      refundAmount,
      penaltyAmount,
      refundPayment
    };
  } catch (error) {
    console.error('Erreur lors du remboursement partiel:', error);
    throw error;
  }
}; 