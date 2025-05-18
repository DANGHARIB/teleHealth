/**
 * Service pour nettoyer les rendez-vous non payés
 */

const Appointment = require('../models/Appointment');

/**
 * Nettoie les rendez-vous en attente de paiement qui n'ont pas été payés après un certain délai
 * @param {number} minutes - Délai en minutes après lequel un rendez-vous en attente est considéré comme abandonné
 */
const cleanupPendingAppointments = async (minutes = 30) => {
  try {
    console.log(`Recherche des rendez-vous en attente de plus de ${minutes} minutes...`);
    
    // Heure limite (maintenant - délai)
    const cutoffTime = new Date(Date.now() - (minutes * 60 * 1000));
    
    // Trouver tous les rendez-vous en attente créés avant l'heure limite
    const pendingAppointments = await Appointment.find({
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { $lt: cutoffTime }
    });
    
    console.log(`${pendingAppointments.length} rendez-vous en attente trouvés à nettoyer.`);
    
    // Annuler tous ces rendez-vous
    if (pendingAppointments.length > 0) {
      const appointmentIds = pendingAppointments.map(app => app._id);
      
      const result = await Appointment.updateMany(
        { _id: { $in: appointmentIds } },
        { 
          $set: { 
            status: 'cancelled',
            paymentStatus: 'cancelled'
          }
        }
      );
      
      console.log(`${result.modifiedCount} rendez-vous ont été annulés automatiquement.`);
    }
    
    return {
      processed: pendingAppointments.length
    };
  } catch (error) {
    console.error('Erreur lors du nettoyage des rendez-vous en attente :', error);
    throw error;
  }
};

module.exports = {
  cleanupPendingAppointments
}; 