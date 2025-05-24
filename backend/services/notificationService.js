const schedule = require('node-schedule');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Notification manager for the application
 * This service handles sending notifications for appointments and payments
 * 
 * It has two main functions:
 * 1. Send push notifications to users' devices
 * 2. Persist notifications in the database for later display
 */

// Temporary map to store active tokens (for compatibility with existing code)
const deviceTokens = new Map();

// Register a device token for a user
exports.registerDeviceToken = async (userId, token) => {
  try {
    // Register in the database
    await User.findByIdAndUpdate(userId, { deviceToken: token });
    
    // Keep in temporary map for compatibility
    deviceTokens.set(userId, token);
    console.log(`Device token registered for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error while registering token for user ${userId}:`, error);
    return false;
  }
};

// Get a user's device token (first from database, then from temporary map)
exports.getDeviceToken = async (userId) => {
  try {
    // Check first in the database
    const user = await User.findById(userId);
    if (user && user.deviceToken) {
      return user.deviceToken;
    }
    
    // Fall back to temporary map if necessary
    return deviceTokens.get(userId);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Create a persistent notification in the database
 * 
 * @param {string} userId - Recipient user ID
 * @param {string} title - Notification title
 * @param {string} message - Detailed notification message
 * @param {string} type - Notification type (see Notification model for available types)
 * @param {Object} data - Additional data for the notification
 * @param {string} priority - Notification priority (low, normal, high)
 * @param {Date} expiresAt - Notification expiration date (null = no expiration)
 * @returns {Promise<Notification>} The created notification
 */
exports.createNotification = async (userId, title, message, type, data = {}, priority = 'normal', expiresAt = null) => {
  try {
    console.log(`Creating a persistent notification for user ${userId}`);
    
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
    
    console.log(`Persistent notification successfully created, ID: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('Error creating persistent notification:', error);
    return null;
  }
};

/**
 * Send a notification to a user
 * 
 * This function handles both:
 * 1. Creating a persistent notification in the database
 * 2. Sending a push notification to the user's device
 * 
 * @param {string} userId - Recipient user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body (short message)
 * @param {Object} data - Additional data for the notification
 * @param {boolean} persist - If true, persists the notification in the database
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
exports.sendNotification = async (userId, title, body, data = {}, persist = true) => {
  try {
    console.log(`Sending notification to user ${userId}:`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Data: ${JSON.stringify(data)}`);
    
    // 1. Persist the notification in the database if requested
    let notification = null;
    if (persist) {
      notification = await this.createNotification(
        userId,
        title,
        body,
        data.type || 'system',
        data
      );
      
      // Add notification ID to data for reference
      if (notification) {
        data.notificationId = notification._id.toString();
      }
    }
    
    // 2. Send push notification
    // Get user token
    const token = await this.getDeviceToken(userId);
    
    if (!token) {
      console.log(`No device token found for user ${userId}`);
      return notification !== null; // Success if notification was persisted, failure otherwise
    }
    
    // In production, this function would actually send the notification via Expo or Firebase
    console.log(`PUSH notification sent to user ${userId}`);
    
    // In a real implementation, we would use a service like:
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
    
    // Mark notification as pushed
    if (notification) {
      notification.pushed = true;
      await notification.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Appointment creation notification
exports.notifyAppointmentCreated = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notify the doctor
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      await this.sendNotification(
        doctorUser._id,
        'New appointment',
        `You have a new appointment with ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} on ${populatedAppointment.availability.date} at ${populatedAppointment.availability.startTime}`,
        { 
          appointmentId: appointment._id, 
          type: 'new_appointment',
          patientId: populatedAppointment.patient._id
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending appointment creation notification:', error);
    return false;
  }
};

// Appointment confirmation notification
exports.notifyAppointmentConfirmed = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notify the patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Appointment confirmed',
        `Your appointment with Dr. ${populatedAppointment.doctor.last_name} on ${populatedAppointment.availability.date} at ${populatedAppointment.availability.startTime} has been confirmed`,
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
    console.error('Error sending appointment confirmation notification:', error);
    return false;
  }
};

// Appointment rescheduling notification
exports.notifyAppointmentRescheduled = async (appointment, oldDate, oldTime) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notify the patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Appointment rescheduled',
        `Your appointment with Dr. ${populatedAppointment.doctor.last_name} originally scheduled for ${oldDate} at ${oldTime} has been rescheduled for ${populatedAppointment.availability.date} at ${populatedAppointment.availability.startTime}`,
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
    console.error('Error sending appointment rescheduling notification:', error);
    return false;
  }
};

// Reschedule request notification from doctor
exports.notifyRescheduleRequest = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'user first_name last_name full_name')
      .populate('patient', 'user first_name last_name full_name')
      .populate('availability', 'date');

    if (!appointment) {
      console.error('Appointment not found for reschedule request:', appointmentId);
      return false;
    }
    
    const doctorName = appointment.doctor.full_name || `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`;
    const appointmentDate = new Date(appointment.availability.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Notify the patient
    const patientUser = await User.findById(appointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Reschedule request',
        `${doctorName} would like to reschedule your appointment on ${appointmentDate} at ${appointment.slotStartTime} due to a conflict. Please choose a new time slot.`,
        { 
          appointmentId: appointment._id, 
          type: 'reschedule_requested',
          doctorId: appointment.doctor._id,
          doctorName,
          appointmentDate,
          appointmentTime: appointment.slotStartTime,
          action: 'reschedule'
        },
        true, // Persist notification
        'high' // High priority
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending reschedule request notification:', error);
    return false;
  }
};

// Appointment rescheduled by PATIENT notification
exports.notifyAppointmentRescheduledByPatient = async (appointment, oldDate, oldTime) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name full_name') // Added full_name
      .populate('patient', 'user first_name last_name full_name') // Added full_name
      .populate('availability', 'date startTime'); // This is the new availability

    const doctorName = populatedAppointment.doctor.full_name || `Dr. ${populatedAppointment.doctor.first_name} ${populatedAppointment.doctor.last_name}`;
    const patientName = populatedAppointment.patient.full_name || `${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name}`;
    
    const newAppointmentDateStr = new Date(populatedAppointment.availability.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const oldAppointmentDateStr = new Date(oldDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Notify the patient
    const patientUser = await User.findById(populatedAppointment.patient.user);
    if (patientUser) {
      await this.sendNotification(
        patientUser._id,
        'Appointment successfully rescheduled',
        `Your appointment with ${doctorName} originally scheduled for ${oldAppointmentDateStr} at ${oldTime} has been rescheduled for ${newAppointmentDateStr} at ${populatedAppointment.slotStartTime}.`,
        { 
          appointmentId: appointment._id, 
          type: 'rescheduled',
          doctorId: populatedAppointment.doctor._id,
          oldDate,
          oldTime
        }
      );
    }

    // Notify the doctor
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      await this.sendNotification(
        doctorUser._id,
        'Appointment rescheduled by patient',
        `The appointment with ${patientName} originally scheduled for ${oldAppointmentDateStr} at ${oldTime} has been rescheduled by the patient for ${newAppointmentDateStr} at ${populatedAppointment.slotStartTime}.`,
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
    console.error('Error sending rescheduling notification (by patient):', error);
    return false;
  }
};

// Appointment cancellation notification
exports.notifyAppointmentCancelled = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    // Notify the doctor
    const doctorUser = await User.findById(populatedAppointment.doctor.user);
    if (doctorUser) {
      await this.sendNotification(
        doctorUser._id,
        'Appointment cancelled',
        `The appointment with ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} on ${populatedAppointment.availability.date} at ${populatedAppointment.availability.startTime} has been cancelled`,
        { 
          appointmentId: appointment._id, 
          type: 'cancelled_appointment',
          patientId: populatedAppointment.patient._id
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending appointment cancellation notification:', error);
    return false;
  }
};

// Payment received notification
exports.notifyPaymentReceived = async (payment) => {
  try {
    // Notify the doctor
    const appointment = await Appointment.findById(payment.appointment)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name');
    
    const doctorUser = await User.findById(appointment.doctor.user);
    if (doctorUser) {
      await this.sendNotification(
        doctorUser._id,
        'Payment received',
        `You have received a payment of ${payment.amount}€ for your consultation with ${appointment.patient.first_name} ${appointment.patient.last_name}`,
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
    console.error('Error sending payment notification:', error);
    return false;
  }
};

// Schedule appointment reminders
exports.scheduleAppointmentReminders = async (appointment) => {
  try {
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'user first_name last_name')
      .populate('patient', 'user first_name last_name')
      .populate('availability', 'date startTime');
    
    const appointmentDate = new Date(`${populatedAppointment.availability.date}T${populatedAppointment.availability.startTime}`);
    
    // Subtract 1 hour for the reminder
    const reminderTime = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
    
    // Check if reminder time is in the future
    if (reminderTime > new Date()) {
      // Schedule reminder for patient
      const patientUser = await User.findById(populatedAppointment.patient.user);
      if (patientUser) {
        schedule.scheduleJob(reminderTime, async () => {
          await this.sendNotification(
            patientUser._id,
            'Appointment reminder',
            `Reminder: You have an appointment with Dr. ${populatedAppointment.doctor.last_name} in 1 hour (${populatedAppointment.availability.startTime})`,
            { 
              appointmentId: appointment._id, 
              type: 'appointment_reminder',
              doctorId: populatedAppointment.doctor._id,
              reminderType: 'upcoming'
            }
          );
        });
      }
      
      // Schedule reminder for doctor
      const doctorUser = await User.findById(populatedAppointment.doctor.user);
      if (doctorUser) {
        schedule.scheduleJob(reminderTime, async () => {
          await this.sendNotification(
            doctorUser._id,
            'Appointment reminder',
            `Reminder: You have an appointment with ${populatedAppointment.patient.first_name} ${populatedAppointment.patient.last_name} in 1 hour (${populatedAppointment.availability.startTime})`,
            { 
              appointmentId: appointment._id, 
              type: 'appointment_reminder',
              patientId: populatedAppointment.patient._id,
              reminderType: 'upcoming'
            }
          );
        });
      }
      
      console.log(`Appointment reminders scheduled for ${reminderTime}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error scheduling appointment reminders:', error);
    return false;
  }
};
