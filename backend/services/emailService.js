require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Configure SMTP transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail', // Automatically uses smtp.gmail.com:465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Application password!
  },
});

/**
 * Generic function to send an email
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Email content in plain text
 * @param {string} html - Email content in HTML (optional)
 * @returns {Promise} - Email sending result
 */
const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: `"TeleHealth" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `[TeleHealth] ${subject}`,
    text,
  };

  if (html) {
    mailOptions.html = html;
  }

  logger.info(`Sending email to ${to} with subject "${subject}" via Gmail`);
  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email successfully sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Sends an OTP code to the patient via email
 * @param {string} email - Patient's email
 * @param {string} otp - Generated OTP code
 * @returns {Promise} - Email sending result
 */
const sendOtpEmail = async (email, otp) => {
  const subject = 'Your verification code';
  const text = `Your verification code is: ${otp}. This code is valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4285f4; color: white; padding: 20px; text-align: center;">
        <h1>TeleHealth</h1>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #ddd;">
        <h2>Account Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Email sent from TeleHealth
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

/**
 * Sends Zoom session link to participants (doctor and patient)
 * @param {Object} appointment - Appointment object with references to doctor and patient
 * @param {string} doctorEmail - Doctor's email
 * @param {string} patientEmail - Patient's email
 * @param {string} zoomLink - Zoom session link
 * @param {string} appointmentDate - Formatted appointment date
 * @param {string} appointmentTime - Formatted appointment time
 * @returns {Promise} - Email sending results
 */
const sendAppointmentZoomLink = async (appointment, doctorEmail, patientEmail, zoomLink, appointmentDate, appointmentTime) => {
  const doctorSubject = 'Link for your upcoming medical consultation';
  const patientSubject = 'Link for your upcoming medical appointment';
  
  const doctorText = `An appointment is confirmed for ${appointmentDate} at ${appointmentTime}. Here is the link to join the consultation: ${zoomLink}`;
  const patientText = `Your medical appointment is confirmed for ${appointmentDate} at ${appointmentTime}. Here is the link to join the consultation: ${zoomLink}`;
  
  const commonHtml = (recipientType) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4285f4; color: white; padding: 20px; text-align: center;">
        <h1>TeleHealth</h1>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #ddd;">
        <h2>Medical Appointment Confirmed</h2>
        <p>${recipientType === 'doctor' ? 'A patient has' : 'You have'} an appointment on <strong>${appointmentDate}</strong> at <strong>${appointmentTime}</strong>.</p>
        <div style="margin: 20px 0;">
          <a href="${zoomLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Join Consultation
          </a>
        </div>
        <p>You can also copy this link in your browser: ${zoomLink}</p>
        <p>Please connect a few minutes before the start of the consultation.</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Email sent from TeleHealth
      </div>
    </div>
  `;
  
  const doctorHtml = commonHtml('doctor');
  const patientHtml = commonHtml('patient');
  
  // Send in parallel to both recipients
  const results = await Promise.all([
    sendEmail(doctorEmail, doctorSubject, doctorText, doctorHtml),
    sendEmail(patientEmail, patientSubject, patientText, patientHtml)
  ]);
  
  return results;
};

/**
 * Sends a verification approval email to a doctor
 * @param {Object} doctor - Doctor object with email, name
 * @returns {Promise} - Email sending result
 */
const sendVerificationEmail = async (doctor) => {
  const email = doctor.email || doctor.user?.email;
  const name = doctor.full_name || `${doctor.first_name} ${doctor.last_name}`;
  
  const subject = 'Votre compte médecin a été approuvé';
  const text = `Félicitations ${name}, votre compte médecin sur TeleHealth a été vérifié et approuvé. Vous pouvez maintenant vous connecter et commencer à utiliser la plateforme.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4285f4; color: white; padding: 20px; text-align: center;">
        <h1>TeleHealth</h1>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #ddd;">
        <h2>Compte Vérifié</h2>
        <p>Félicitations ${name},</p>
        <p>Votre compte médecin sur TeleHealth a été vérifié et approuvé.</p>
        <p>Vous pouvez maintenant vous connecter et commencer à utiliser la plateforme.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://tabeebou.com'}/doctor/auth/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Se connecter
          </a>
        </div>
        <p>Merci de faire partie de notre réseau de médecins!</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Email envoyé depuis TeleHealth
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

/**
 * Sends a rejection email to a doctor
 * @param {Object} doctor - Doctor object with email, name
 * @param {string} reason - Reason for rejection
 * @returns {Promise} - Email sending result
 */
const sendRejectionEmail = async (doctor, reason) => {
  const email = doctor.email || doctor.user?.email;
  const name = doctor.full_name || `${doctor.first_name} ${doctor.last_name}`;
  
  const subject = 'Information concernant votre demande de compte médecin';
  const text = `Cher ${name}, nous avons examiné votre demande de compte médecin sur TeleHealth et nous sommes désolés de vous informer que votre demande n'a pas été approuvée. Raison: ${reason || 'Les informations fournies ne correspondent pas à nos critères de vérification.'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4285f4; color: white; padding: 20px; text-align: center;">
        <h1>TeleHealth</h1>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #ddd;">
        <h2>Information sur votre demande</h2>
        <p>Cher ${name},</p>
        <p>Nous avons examiné votre demande de compte médecin sur TeleHealth.</p>
        <p>Nous sommes désolés de vous informer que votre demande n'a pas été approuvée.</p>
        <p><strong>Raison:</strong> ${reason || 'Les informations fournies ne correspondent pas à nos critères de vérification.'}</p>
        <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre une nouvelle demande avec des informations mises à jour, vous pouvez vous inscrire à nouveau via notre application mobile.</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Email envoyé depuis TeleHealth
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

/**
 * Sends a notification email to a doctor after registration
 * @param {Object} doctor - Doctor object with email, name
 * @returns {Promise} - Email sending result
 */
const sendDoctorRegistrationNotification = async (doctor) => {
  const email = doctor.email || doctor.user?.email;
  const name = doctor.full_name || `${doctor.first_name} ${doctor.last_name}`;
  
  const subject = 'Votre compte médecin est en cours de vérification';
  const text = `Bonjour ${name}, votre compte médecin sur TeleHealth a été créé avec succès. Votre compte est actuellement en cours de vérification par notre équipe. Vous recevrez une notification dès que votre profil sera validé.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4285f4; color: white; padding: 20px; text-align: center;">
        <h1>TeleHealth</h1>
      </div>
      <div style="padding: 20px; background: white; border: 1px solid #ddd;">
        <h2>Compte en cours de vérification</h2>
        <p>Bonjour ${name},</p>
        <p>Votre compte médecin sur TeleHealth a été créé avec succès.</p>
        <p>Votre compte est actuellement <strong>en cours de vérification</strong> par notre équipe.</p>
        <p>Ce processus peut prendre jusqu'à 48 heures ouvrables.</p>
        <p>Vous recevrez une notification dès que votre profil sera validé.</p>
        <p>Merci de votre patience!</p>
      </div>
      <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        Email envoyé depuis TeleHealth
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendAppointmentZoomLink,
  sendVerificationEmail,
  sendRejectionEmail,
  sendDoctorRegistrationNotification
}; 