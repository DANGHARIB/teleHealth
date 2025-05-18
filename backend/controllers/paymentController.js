const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { sendAppointmentZoomLink } = require('../services/emailService');
const logger = require('../config/logger');

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