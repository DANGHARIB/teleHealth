const schedule = require('node-schedule');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Gestionnaire de notifications pour l'application
 * Ce service gère l'envoi de notifications pour les rendez-vous et paiements
 * 
 * Il a deux fonctions principales:
 * 1. Envoyer des notifications push aux appareils des utilisateurs
 * 2. Persister les notifications dans la base de données pour affichage ultérieur
 */

// Map temporaire pour stocker les jetons actifs (pour la compatibilité avec le code existant)
const deviceTokens = new Map();

// Enregistrer un jeton d'appareil pour un utilisateur
exports.registerDeviceToken = async (userId, token) => {
  try {
    // Enregistrer dans la base de données
    await User.findByIdAndUpdate(userId, { deviceToken: token });
    
    // Conserver dans la map temporaire pour la compatibilité
    deviceTokens.set(userId, token);
    console.log(`Token d'appareil enregistré pour l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement du token pour l'utilisateur ${userId}:`, error);
    return false;
  }
};

// Obtenir le jeton d'appareil d'un utilisateur (d'abord depuis la base de données, puis depuis la map temporaire)
exports.getDeviceToken = async (userId) => {
  try {
    // Vérifier d'abord dans la base de données
    const user = await User.findById(userId);
    if (user && user.deviceToken) {
      return user.deviceToken;
    }
    
    // Retomber sur la map temporaire si nécessaire
    return deviceTokens.get(userId);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Créer une notification persistante dans la base de données
 * 
 * @param {string} userId - ID de l'utilisateur destinataire
 * @param {string} title - Titre de la notification
 * @param {string} message - Message détaillé de la notification
 * @param {string} type - Type de notification (voir le modèle Notification pour les types disponibles)
 * @param {Object} data - Données supplémentaires pour la notification
 * @param {string} priority - Priorité de la notification (low, normal, high)
 * @param {Date} expiresAt - Date d'expiration de la notification (null = pas d'expiration)
 * @returns {Promise<Notification>} La notification créée
 */
exports.createNotification = async (userId, title, message, type, data = {}, priority = 'normal', expiresAt = null) => {
  try {
    console.log(`Création d'une notification persistante pour l'utilisateur ${userId}`);
    
    const notification = await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      data,
      read: false,
      pushed: false,
      priority,
      expiresAt
    });
    
    console.log(`Notification persistante créée avec succès, ID: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification persistante:', error);
    return null;
  }
};

/**
 * Envoyer une notification à un utilisateur
 * 
 * Cette fonction gère à la fois:
 * 1. La création d'une notification persistante dans la base de données
 * 2. L'envoi d'une notification push à l'appareil de l'utilisateur
 * 
 * @param {string} userId - ID de l'utilisateur destinataire
 * @param {string} title - Titre de la notification
 * @param {string} body - Corps de la notification (message court)
 * @param {Object} data - Données supplémentaires pour la notification
 * @param {boolean} persist - Si true, persiste la notification dans la base de données
 * @returns {Promise<boolean>} true si succès, false sinon
 */
exports.sendNotification = async (userId, title, body, data = {}, persist = true) => {
  try {
    console.log(`Envoi de notification à l'utilisateur ${userId}:`);
    console.log(`Titre: ${title}`);
    console.log(`Corps: ${body}`);
    console.log(`Données: ${JSON.stringify(data)}`);
    
    // 1. Persister la notification dans la base de données si demandé
    let notification = null;
    if (persist) {
      notification = await this.createNotification(
        userId,
        title,
        body,
        data.type || 'system',
        data
      );
      
      // Ajouter l'ID de la notification aux données pour référence
      if (notification) {
        data.notificationId = notification._id.toString();
      }
    }
    
    // 2. Envoyer la notification push
    // Obtenir le token de l'utilisateur
    const token = await this.getDeviceToken(userId);
    
    if (!token) {
      console.log(`Aucun token d'appareil trouvé pour l'utilisateur ${userId}`);
      return notification !== null; // Succès si la notification a été persistée, échec sinon
    }
    
    // En production, cette fonction enverrait réellement la notification via Expo ou Firebase
    console.log(`Notification PUSH envoyée à l'utilisateur ${userId}`);
    
    // Dans une implémentation réelle, on utiliserait un service comme:
    // await fetch('https://exp.host/--/api/v2/push/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: token,
    //     title,
    //     body,
    //     data,
    //   }),
    // });
    
    // Marquer la notification comme envoyée en push
    if (notification) {
      notification.pushed = true;
      await notification.save();
    }
    
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
      await this.sendNotification(
        doctorUser._id,
        'Nouveau rendez-vous',
        `Vous avez un nouveau rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime}`,
        { 
          appointmentId: appointment._id, 
          type: 'new_appointment',
          patientId: populatedAppointment.patient._id
        }
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
      await this.sendNotification(
        patientUser._id,
        'Rendez-vous confirmé',
        `Votre rendez-vous avec Dr ${populatedAppointment.doctor.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime} a été confirmé`,
        { 
          appointmentId: appointment._id, 
          type: 'confirmed_appointment',
          doctorId: populatedAppointment.doctor._id,
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
      await this.sendNotification(
        patientUser._id,
        'Rendez-vous reprogrammé',
        `Votre rendez-vous avec Dr ${populatedAppointment.doctor.last_name} initialement prévu le ${oldDate} à ${oldTime} a été reprogrammé pour le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime}`,
        { 
          appointmentId: appointment._id, 
          type: 'rescheduled',
          doctorId: populatedAppointment.doctor._id,
          oldDate,
          oldTime
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de reprogrammation de rendez-vous:', error);
    return false;
  }
};

// Notification de demande de reprogrammation par le médecin
exports.notifyRescheduleRequest = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'user first_name last_name full_name')
      .populate('patient', 'user first_name last_name full_name')
      .populate('availability', 'date');

    if (!appointment) {
      console.error('Rendez-vous non trouvé pour la demande de reprogrammation:', appointmentId);
      return false;
    }
    
    const doctorName = appointment.doctor.full_name || `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`;
    const appointmentDate = new Date(appointment.availability.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Notifier le patient
    const patientUser = await User.findById(appointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Demande de reprogrammation',
        `${doctorName} souhaite reprogrammer votre rendez-vous du ${appointmentDate} à ${appointment.slotStartTime} en raison d'un empêchement. Veuillez choisir un nouveau créneau horaire.`,
        { 
          appointmentId: appointment._id, 
          type: 'reschedule_requested',
          doctorId: appointment.doctor._id,
          doctorName,
          appointmentDate,
          appointmentTime: appointment.slotStartTime,
          action: 'reschedule'
        },
        true, // Persister la notification
        'high' // Priorité élevée
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de demande de reprogrammation:', error);
    return false;
  }
};

// Notification de reprogrammation de rendez-vous par le PATIENT
exports.notifyAppointmentRescheduledByPatient = async (appointment, oldDate, oldTime) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name full_name') // Added full_name
      .populate('patient', 'user first_name last_name full_name') // Added full_name
      .populate('availability', 'date startTime'); // This is the new availability

    const doctorName = populatedAppointment.doctor.full_name || `Dr. ${populatedAppointment.doctor.first_name} ${populatedAppointment.doctor.last_name}`;
    const patientName = populatedAppointment.patient.full_name || `${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name}`;
    
    const newAppointmentDateStr = new Date(populatedAppointment.availability.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const oldAppointmentDateStr = new Date(oldDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    // Notifier le patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Rendez-vous reprogrammé avec succès',
        `Votre rendez-vous avec ${doctorName} initialement prévu le ${oldAppointmentDateStr} à ${oldTime} a été reprogrammé pour le ${newAppointmentDateStr} à ${populatedAppointment.slotStartTime}.`,
        { 
          appointmentId: appointment._id, 
          type: 'rescheduled',
          doctorId: populatedAppointment.doctor._id,
          oldDate,
          oldTime
        }
      );
    }

    // Notifier le médecin
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      await this.sendNotification(
        doctorUser._id,
        'Rendez-vous reprogrammé par un patient',
        `Le rendez-vous avec ${patientName} initialement prévu le ${oldAppointmentDateStr} à ${oldTime} a été reprogrammé par le patient pour le ${newAppointmentDateStr} à ${populatedAppointment.slotStartTime}.`,
        { 
          appointmentId: appointment._id, 
          type: 'rescheduled',
          patientId: populatedAppointment.patient._id,
          oldDate,
          oldTime
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de reprogrammation (par patient):', error);
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
      await this.sendNotification(
        doctorUser._id,
        'Rendez-vous annulé',
        `Le rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} le ${populatedAppointment.availability.date} à ${populatedAppointment.availability.startTime} a été annulé`,
        { 
          appointmentId: appointment._id, 
          type: 'cancelled_appointment',
          patientId: populatedAppointment.patient._id
        }
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
      await this.sendNotification(
        doctorUser._id,
        'Paiement reçu',
        `Vous avez reçu un paiement de ${payment.amount}€ pour votre consultation avec ${appointment.patient.first_name} ${appointment.patient.last_name}`,
        { 
          paymentId: payment._id, 
          type: 'payment_received',
          appointmentId: appointment._id,
          patientId: appointment.patient._id,
          amount: payment.amount
        }
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
        schedule.scheduleJob(reminderTime, async () => {
          await this.sendNotification(
            patientUser._id,
            'Rappel de rendez-vous',
            `Rappel: Vous avez rendez-vous avec Dr ${populatedAppointment.doctor.last_name} dans 1 heure (${populatedAppointment.availability.startTime})`,
            { 
              appointmentId: appointment._id, 
              type: 'appointment_reminder',
              doctorId: populatedAppointment.doctor._id,
              reminderType: 'upcoming'
            }
          );
        });
      }
      
      // Planifier le rappel pour le médecin
      const doctorUser = await User.findById(populatedAppointment.doctor.user);
      if (doctorUser) {
        schedule.scheduleJob(reminderTime, async () => {
          await this.sendNotification(
            doctorUser._id,
            'Rappel de rendez-vous',
            `Rappel: Vous avez rendez-vous avec ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} dans 1 heure (${populatedAppointment.availability.startTime})`,
            { 
              appointmentId: appointment._id, 
              type: 'appointment_reminder',
              patientId: populatedAppointment.patient._id,
              reminderType: 'upcoming'
            }
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
