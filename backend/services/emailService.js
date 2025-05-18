const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Création du transporteur SMTP avec les identifiants Brevo (Sendinblue)
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST, // smtp-relay.brevo.com
  port: process.env.BREVO_SMTP_PORT, // 587 (TLS) ou 465 (SSL)
  secure: process.env.BREVO_SMTP_PORT == 465, // true pour 465, false pour 587
  auth: {
    user: process.env.BREVO_SMTP_USER, // Votre adresse email associée à Brevo
    pass: process.env.BREVO_API_KEY,   // Votre clé API Brevo
  },
});

/**
 * Fonction générique pour envoyer un email
 * @param {string} to - Adresse email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} text - Contenu de l'email en texte brut
 * @param {string} html - Contenu de l'email en HTML (optionnel)
 * @returns {Promise} - Résultat de l'envoi d'email
 */
const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
  };

  if (html) {
    mailOptions.html = html;
  }

  logger.info(`Envoi d'un email à ${to} avec le sujet "${subject}" via Brevo`);
  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email envoyé avec succès à ${to} : ${info.response}`);
    return info;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de l'email à ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Envoie un code OTP au patient par email
 * @param {string} email - Email du patient
 * @param {string} otp - Code OTP généré
 * @returns {Promise} - Résultat de l'envoi d'email
 */
const sendOtpEmail = async (email, otp) => {
  const subject = 'Votre code de vérification';
  const text = `Votre code de vérification est: ${otp}. Ce code est valable pendant 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Vérification de votre compte</h2>
      <p>Votre code de vérification est:</p>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>Ce code est valable pendant 10 minutes.</p>
      <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

/**
 * Envoie le lien de la session Zoom aux participants (médecin et patient)
 * @param {Object} appointment - L'objet rendez-vous avec les références au médecin et au patient
 * @param {string} doctorEmail - Email du médecin
 * @param {string} patientEmail - Email du patient
 * @param {string} zoomLink - Lien de la session Zoom
 * @param {string} appointmentDate - Date du rendez-vous formatée
 * @param {string} appointmentTime - Heure du rendez-vous formatée
 * @returns {Promise} - Résultat des envois d'email
 */
const sendAppointmentZoomLink = async (appointment, doctorEmail, patientEmail, zoomLink, appointmentDate, appointmentTime) => {
  const doctorSubject = 'Lien pour votre consultation médicale à venir';
  const patientSubject = 'Lien pour votre rendez-vous médical à venir';
  
  const doctorText = `Un rendez-vous est confirmé pour le ${appointmentDate} à ${appointmentTime}. Voici le lien pour rejoindre la consultation: ${zoomLink}`;
  const patientText = `Votre rendez-vous médical est confirmé pour le ${appointmentDate} à ${appointmentTime}. Voici le lien pour rejoindre la consultation: ${zoomLink}`;
  
  const commonHtml = (recipientType) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Rendez-vous médical confirmé</h2>
      <p>${recipientType === 'doctor' ? 'Un patient a' : 'Vous avez'} un rendez-vous le <strong>${appointmentDate}</strong> à <strong>${appointmentTime}</strong>.</p>
      <div style="margin: 20px 0;">
        <a href="${zoomLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Rejoindre la consultation
        </a>
      </div>
      <p>Vous pouvez aussi copier ce lien dans votre navigateur: ${zoomLink}</p>
      <p>Veuillez vous connecter quelques minutes avant le début de la consultation.</p>
    </div>
  `;
  
  const doctorHtml = commonHtml('doctor');
  const patientHtml = commonHtml('patient');
  
  // Envoi en parallèle aux deux destinataires
  const results = await Promise.all([
    sendEmail(doctorEmail, doctorSubject, doctorText, doctorHtml),
    sendEmail(patientEmail, patientSubject, patientText, patientHtml)
  ]);
  
  return results;
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendAppointmentZoomLink
}; 