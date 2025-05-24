const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { sendAppointmentZoomLink } = require('../services/emailService');
const logger = require('../config/logger');
const Availability = require('../models/Availability');

// @desc    Créer un rendez-vous et un paiement en une seule opération
// @route   POST /api/payments/appointment-with-payment
// @access  Private/Patient
exports.createAppointmentWithPayment = async (req, res) => {
  try {
    const {
      doctorId,
      availabilityId, 
      slotStartTime,
      slotEndTime,
      price,
      duration,
      caseDetails,
      paymentMethod,
      savedPaymentMethodId  // Optionnel
    } = req.body;

    logger.info("===== DÉBUT CRÉATION RENDEZ-VOUS AVEC PAIEMENT =====");
    logger.info("Données reçues:", JSON.stringify({
      doctorId, availabilityId, slotStartTime, slotEndTime, price, duration, caseDetails, paymentMethod
    }, null, 2));

    // Vérifications des paramètres obligatoires
    if (!doctorId || !availabilityId || !slotStartTime || !slotEndTime || !paymentMethod) {
      return res.status(400).json({ 
        message: "Paramètres obligatoires manquants" 
      });
    }

    // Récupérer le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      logger.error("❌ Patient non trouvé pour l'utilisateur:", req.user._id);
      return res.status(404).json({ message: "Patient non trouvé" });
    }
    
    // Récupérer le médecin
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      logger.error("❌ Médecin non trouvé:", doctorId);
      return res.status(404).json({ message: "Médecin non trouvé" });
    }
    
    // Récupérer la disponibilité
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      logger.error("❌ Disponibilité non trouvée:", availabilityId);
      return res.status(404).json({ message: "Disponibilité non trouvée" });
    }
    
    // Vérifier si ce patient a déjà un rendez-vous avec ce médecin le même jour
    const sameDay = new Date(availability.date);
    const nextDay = new Date(sameDay);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAppointmentForPatient = await Appointment.findOne({
      doctor: doctorId,
      patient: patient._id,
      "availability": { $in: await Availability.find({
        doctor: doctorId,
        date: { $gte: sameDay, $lt: nextDay }
      }).select('_id') },
      status: { $nin: ["cancelled", "rejected"] },
      paymentStatus: "completed"
    });

    if (existingAppointmentForPatient) {
      logger.error("❌ Patient a déjà un rendez-vous pour cette date");
      return res.status(400).json({
        message: "Vous avez déjà un rendez-vous avec ce médecin pour cette date"
      });
    }
    
    // Vérifier si ce créneau spécifique est déjà réservé
    const existingAppointmentForSlot = await Appointment.findOne({
      doctor: doctorId,
      availability: availabilityId,
      slotStartTime: slotStartTime,
      status: { $nin: ["cancelled", "rejected"] },
      $or: [
        { paymentStatus: "completed" },
        { 
          paymentStatus: "pending", 
          createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
        }
      ]
    });

    if (existingAppointmentForSlot) {
      logger.error("❌ Créneau spécifique déjà réservé");
      return res.status(400).json({
        message: "Ce créneau est déjà réservé. Veuillez en choisir un autre."
      });
    }
    
    // Créer le rendez-vous
    const appointment = new Appointment({
      doctor: doctorId,
      patient: patient._id,
      availability: availabilityId,
      slotStartTime,
      slotEndTime,
      price: price || 28,
      duration: duration || 30,
      caseDetails: caseDetails || "Consultation standard",
      status: "confirmed",  // Directement confirmé car le paiement est immédiat
      paymentStatus: "completed"
    });

    // Générer un lien Zoom aléatoire pour la consultation
    const zoomId = Math.random().toString(36).substring(2, 10);
    const zoomLink = `https://zoom.us/j/${zoomId}`;
    appointment.sessionLink = zoomLink;
    
    // Sauvegarder le rendez-vous
    const createdAppointment = await appointment.save();
    logger.info("✅ Rendez-vous créé avec succès:", createdAppointment._id);
    
    // Marquer le créneau comme réservé
    availability.isBooked = true;
    await availability.save();
    logger.info("✅ Créneau marqué comme réservé");
    
    // Créer le paiement
    const payment = new Payment({
      appointment: createdAppointment._id,
      patient: patient._id,
      amount: price || createdAppointment.price,
      paymentMethod,
      status: 'completed'
    });
    
    // Sauvegarder le paiement
    const createdPayment = await payment.save();
    logger.info("✅ Paiement créé avec succès:", createdPayment._id);
    
    // Notifications et emails
    try {
      await notificationService.notifyAppointmentCreated(createdAppointment);
      await notificationService.notifyPaymentReceived(createdPayment);
      await notificationService.scheduleAppointmentReminders(createdAppointment);
      
      // Envoi du lien Zoom
      const doctorUser = await User.findById(doctor.user);
      const patientUser = await User.findById(req.user._id);
      
      if (doctorUser && patientUser) {
        const appointmentDate = new Date(availability.date).toLocaleDateString('fr-FR');
        await sendAppointmentZoomLink(
          createdAppointment,
          doctorUser.email,
          patientUser.email,
          zoomLink,
          appointmentDate,
          slotStartTime
        );
        logger.info("✅ Lien Zoom envoyé par email");
      }
    } catch (notificationError) {
      logger.error("⚠️ Erreur lors de l'envoi des notifications ou emails:", notificationError);
      // On continue malgré les erreurs de notification
    }
    
    logger.info("===== FIN CRÉATION RENDEZ-VOUS AVEC PAIEMENT =====");
    
    res.status(201).json({
      appointment: createdAppointment,
      payment: createdPayment
    });
    
  } catch (error) {
    logger.error("❌ Erreur lors de la création du rendez-vous avec paiement:", error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la création du rendez-vous avec paiement",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Créer un nouveau paiement (automatiquement complété)
// @route   POST /api/payments
// @access  Private/Patient
exports.createPayment = async (req, res) => {
  try {
    const { appointmentId, paymentMethod, amount } = req.body;
    
    // Vérifier si le rendez-vous existe
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }
    
    // Vérifier si le patient est bien celui qui a pris le rendez-vous
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    if (appointment.patient.toString() !== patient._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à payer pour ce rendez-vous' });
    }
    
    // Créer le paiement (déjà complété)
    const payment = new Payment({
      appointment: appointmentId,
      patient: patient._id,
      amount: amount || appointment.price,
      paymentMethod,
      status: 'completed'
    });
    
    // Générer un lien Zoom aléatoire pour la consultation
    const zoomId = Math.random().toString(36).substring(2, 10);
    const zoomLink = `https://zoom.us/j/${zoomId}`;
    
    // Mettre à jour le statut du rendez-vous, du paiement et le lien de session
    appointment.paymentStatus = 'completed';
    appointment.status = 'confirmed';
    appointment.sessionLink = zoomLink;
    await appointment.save();
    
    // MAINTENANT marquer le créneau spécifique comme réservé (après paiement)
    const availability = await Availability.findById(appointment.availability);
    if (availability) {
      availability.isBooked = true;
      await availability.save();
      logger.info(`Créneau de disponibilité spécifique ${appointment.availability} marqué comme réservé après paiement`);
    } else {
      logger.error(`Disponibilité ${appointment.availability} non trouvée lors du paiement`);
    }
    
    // Sauvegarder le paiement
    const createdPayment = await payment.save();
    
    // Envoyer une notification au médecin pour le paiement reçu
    await notificationService.notifyPaymentReceived(createdPayment);
    
    // Envoyer le lien Zoom par email au médecin et au patient
    try {
      // Récupérer les infos du rendez-vous
      const appointmentWithDetails = await Appointment.findById(appointmentId)
        .populate('availability')
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'email' }
        })
        .populate({
          path: 'patient',
          populate: { path: 'user', select: 'email' }
        });
      
      if (appointmentWithDetails && 
          appointmentWithDetails.doctor && 
          appointmentWithDetails.doctor.user && 
          appointmentWithDetails.patient && 
          appointmentWithDetails.patient.user) {
        
        const doctorEmail = appointmentWithDetails.doctor.user.email;
        const patientEmail = appointmentWithDetails.patient.user.email;
        
        // Formater la date et l'heure du rendez-vous
        const appointmentDate = new Date(appointmentWithDetails.availability.date).toLocaleDateString('fr-FR');
        const appointmentTime = appointmentWithDetails.slotStartTime;
        
        // Envoyer les emails
        await sendAppointmentZoomLink(
          appointmentWithDetails,
          doctorEmail,
          patientEmail,
          zoomLink,
          appointmentDate,
          appointmentTime
        );
        
        logger.info(`Lien Zoom envoyé par email pour le rendez-vous ${appointmentId}`);
      }
    } catch (emailError) {
      logger.error(`Erreur lors de l'envoi du lien Zoom par email: ${emailError.message}`);
      // On continue même si l'envoi d'email échoue
    }
    
    res.status(201).json(createdPayment);
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du paiement' });
  }
};

// @desc    Obtenir tous les paiements d'un patient
// @route   GET /api/payments/patient
// @access  Private/Patient
exports.getPatientPayments = async (req, res) => {
  try {
    // Récupérer l'ID du patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    const payments = await Payment.find({ patient: patient._id })
      .populate({
        path: 'appointment',
        populate: [
          {
            path: 'doctor',
            select: 'first_name last_name full_name'
          },
          {
            path: 'availability',
            select: 'date startTime endTime'
          }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des paiements' });
  }
};

// @desc    Obtenir tous les paiements d'un médecin
// @route   GET /api/payments/doctor
// @access  Private/Doctor
exports.getDoctorPayments = async (req, res) => {
  try {
    // Récupérer l'ID du médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    // Rechercher tous les rendez-vous du médecin
    const doctorAppointments = await Appointment.find({ doctor: doctor._id }).select('_id');
    const appointmentIds = doctorAppointments.map(appointment => appointment._id);
    
    // Récupérer tous les paiements liés à ces rendez-vous
    const payments = await Payment.find({ appointment: { $in: appointmentIds } })
      .populate({
        path: 'appointment',
        populate: [
          {
            path: 'patient',
            select: 'first_name last_name'
          },
          {
            path: 'availability',
            select: 'date startTime endTime'
          }
        ]
      })
      .populate('patient', 'first_name last_name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements du médecin:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des paiements' });
  }
};

// @desc    Obtenir un paiement par ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'appointment',
        populate: [
          {
            path: 'doctor',
            select: 'first_name last_name full_name'
          },
          {
            path: 'availability',
            select: 'date startTime endTime'
          }
        ]
      })
      .populate('patient', 'first_name last_name');
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    // Vérifier les autorisations
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (
      req.user.role !== 'Admin' && 
      (!patient || patient._id.toString() !== payment.patient._id.toString())
    ) {
      return res.status(403).json({ message: 'Non autorisé à accéder à ce paiement' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du paiement' });
  }
};

// @desc    Effectuer un remboursement
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un administrateur
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent effectuer des remboursements' });
    }
    
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    if (payment.status === 'refunded') {
      return res.status(400).json({ message: 'Ce paiement a déjà été remboursé' });
    }
    
    // Effectuer le remboursement
    payment.status = 'refunded';
    await payment.save();
    
    // Mettre à jour le statut de paiement du rendez-vous
    const appointment = await Appointment.findById(payment.appointment);
    if (appointment) {
      appointment.paymentStatus = 'refunded';
      await appointment.save();
    }
    
    res.status(200).json(payment);
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    res.status(500).json({ message: 'Erreur serveur lors du remboursement' });
  }
}; 