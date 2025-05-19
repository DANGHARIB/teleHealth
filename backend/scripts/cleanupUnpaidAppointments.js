/**
 * Script pour nettoyer les rendez-vous non payés
 * Libère les créneaux de rendez-vous qui n'ont pas été payés après 15 minutes
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const logger = require('../config/logger');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Se connecter à la base de données
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB connecté pour le nettoyage des rendez-vous non payés');
  cleanupUnpaidAppointments();
})
.catch((err) => {
  logger.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

async function cleanupUnpaidAppointments() {
  try {
    const timeLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
    
    // Trouver tous les rendez-vous en attente de paiement depuis plus de 15 minutes
    const unpaidAppointments = await Appointment.find({
      paymentStatus: 'pending',
      createdAt: { $lt: timeLimit }
    });
    
    logger.info(`Trouvé ${unpaidAppointments.length} rendez-vous non payés à nettoyer`);
    
    for (const appointment of unpaidAppointments) {
      logger.info(`Nettoyage du rendez-vous: ${appointment._id}`);
      
      try {
        // Ne pas supprimer le rendez-vous de la DB, mais le marquer comme annulé
        appointment.status = 'cancelled';
        appointment.paymentStatus = 'cancelled';
        await appointment.save();
        
        // S'assurer que le créneau de disponibilité est libéré
        if (appointment.availability) {
          const availabilitySlot = await Availability.findById(appointment.availability);
          if (availabilitySlot) {
            availabilitySlot.isBooked = false;
            await availabilitySlot.save();
            logger.info(`Créneau libéré: ${appointment.availability}`);
          }
        }
      } catch (err) {
        logger.error(`Erreur lors du nettoyage du rendez-vous ${appointment._id}:`, err);
      }
    }
    
    logger.info('Nettoyage des rendez-vous non payés terminé');
    mongoose.disconnect();
    
  } catch (err) {
    logger.error('Erreur lors du nettoyage des rendez-vous non payés:', err);
    mongoose.disconnect();
    process.exit(1);
  }
} 