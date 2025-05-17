const schedule = require('node-schedule');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Gestionnaire de notifications pour l'application
 * Ce service gère l'envoi de notifications pour les rendez-vous et paiements
 */

// Stockage temporaire des jetons d'appareil (dans une application réelle, cela serait dans la base de données)
const deviceTokens = new Map();

// Enregistrer un jeton d'appareil pour un utilisateur
exports.registerDeviceToken = (userId, token) => {
  deviceTokens.set(userId, token);
  console.log(`Token d'appareil enregistré pour l'utilisateur ${userId}`);
  return true;
};

// Obtenir le jeton d'appareil d'un utilisateur
exports.getDeviceToken = (userId) => {
  return deviceTokens.get(userId);
};

// Envoyer une notification à un utilisateur
exports.sendNotification = async (userId, title, body, data = {}) => {
  try {
    // En production, cette fonction enverrait réellement la notification via Firebase ou un autre service
    // Ici on simule simplement l'envoi
    const token = deviceTokens.get(userId);
    
    if (!token) {
      console.log(`Aucun token d'appareil trouvé pour l'utilisateur ${userId}`);
      return false;
    }
    
    console.log(`Notification envoyée à l'utilisateur ${userId}:`);
    console.log(`Titre: ${title}`);
    console.log(`Corps: ${body}`);
    console.log(`Données: ${JSON.stringify(data)}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    return false;
  }
};

// Notification de création de rendez-vous
exports.notifyAppointmentCreated = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notifier le médecin
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      this.sendNotification(
        doctorUser._id,
        'Nouveau rendez-vous',
        `Vous avez un nouveau rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime}`,
        { appointmentId: appointment._id, type: 'new_appointment' }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de création de rendez-vous:', error);
    return false;
  }
};

// Notification de confirmation de rendez-vous
exports.notifyAppointmentConfirmed = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notifier le patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      this.sendNotification(
        patientUser._id,
        'Rendez-vous confirmé',
        `Votre rendez-vous avec Dr ${populatedAppointment.doctor.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime} a été confirmé`,
        { 
          appointmentId: appointment._id, 
          type: 'confirmed_appointment',
          sessionLink: appointment.sessionLink
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de confirmation de rendez-vous:', error);
    return false;
  }
};

// Notification de reprogrammation de rendez-vous
exports.notifyAppointmentRescheduled = async (appointment, oldDate, oldTime) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notifier le patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      this.sendNotification(
        patientUser._id,
        'Rendez-vous reprogrammé',
        `Votre rendez-vous avec Dr ${populatedAppointment.doctor.last_name} initialement prévu le ${oldDate} à ${oldTime} a été reprogrammé pour le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime}`,
        { appointmentId: appointment._id, type: 'rescheduled_appointment' }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de reprogrammation de rendez-vous:', error);
    return false;
  }
};

// Notification d'annulation de rendez-vous
exports.notifyAppointmentCancelled = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notifier le médecin
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      this.sendNotification(
        doctorUser._id,
        'Rendez-vous annulé',
        `Le rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime} a été annulé`,
        { appointmentId: appointment._id, type: 'cancelled_appointment' }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification d\'annulation de rendez-vous:', error);
    return false;
  }
};

// Notification de paiement effectué
exports.notifyPaymentReceived = async (payment) => {
  try {
    // Notifier le médecin
    const appointment = await Appointment.findById(payment.appointment)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name');
    
    const doctorUser = await User.findById(appointment.doctor.user);
    if (doctorUser) {
      this.sendNotification(
        doctorUser._id,
        'Paiement reçu',
        `Vous avez reçu un paiement de ${payment.amount}€ pour votre consultation avec ${appointment.patient.first_name} ${appointment.patient.last_name}`,
        { paymentId: payment._id, type: 'payment_received' }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de paiement:', error);
    return false;
  }
};

// Planifier des rappels de rendez-vous
exports.scheduleAppointmentReminders = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    const appointmentDate = new Date(`${populatedAppointment.availability.date}T${populatedAppointment.availability.startTime}`);
    
    // Soustraire 1 heure pour le rappel
    const reminderTime = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
    
    // Vérifier si la date de rappel est dans le futur
    if (reminderTime > new Date()) {
      // Planifier le rappel pour le patient
      const patientUser = await User.findById(populatedAppointment.patient.user);
      if (patientUser) {
        schedule.scheduleJob(reminderTime, () => {
          this.sendNotification(
            patientUser._id,
            'Rappel de rendez-vous',
            `Rappel: Vous avez rendez-vous avec Dr ${populatedAppointment.doctor.last_name} dans 1 heure (${populatedAppointment.availability.startTime})`,
            { appointmentId: appointment._id, type: 'appointment_reminder' }
          );
        });
      }
      
      // Planifier le rappel pour le médecin
      const doctorUser = await User.findById(populatedAppointment.doctor.user);
      if (doctorUser) {
        schedule.scheduleJob(reminderTime, () => {
          this.sendNotification(
            doctorUser._id,
            'Rappel de rendez-vous',
            `Rappel: Vous avez rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} dans 1 heure (${populatedAppointment.availability.startTime})`,
            { appointmentId: appointment._id, type: 'appointment_reminder' }
          );
        });
      }
      
      console.log(`Rappels de rendez-vous programmés pour le ${reminderTime}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la programmation des rappels de rendez-vous:', error);
    return false;
  }
}; 