const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const notificationService = require('../services/notificationService');
const paymentService = require('../services/paymentService');

// @desc    Créer un nouveau rendez-vous
// @route   POST /api/appointments
// @access  Private/Patient
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, availabilityId, price, duration, caseDetails } = req.body;
    
    // Vérifier si le médecin existe
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    // Vérifier si la disponibilité existe
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilité non trouvée' });
    }
    
    // Vérifier si la disponibilité est déjà réservée pour un rendez-vous actif (non annulé)
    const existingActiveAppointment = await Appointment.findOne({
      availability: availabilityId,
      status: { $nin: ['cancelled'] } // Exclure les rendez-vous annulés
    });
    
    if (existingActiveAppointment) {
      return res.status(400).json({ message: 'Ce créneau est déjà réservé' });
    }

    // Rechercher le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Créer le rendez-vous
    const appointment = new Appointment({
      doctor: doctorId,
      patient: patient._id,
      availability: availabilityId,
      price: price || 28, // Prix par défaut
      duration: duration || 30, // Durée par défaut (minutes)
      caseDetails: caseDetails || 'Consultation standard',
      status: 'scheduled', // Statut par défaut est maintenant 'scheduled' car confirmé après paiement
      paymentStatus: 'pending' // Statut de paiement par défaut
    });
    
    // Marquer la disponibilité comme réservée
    availability.isBooked = true;
    await availability.save();
    
    // Sauvegarder le rendez-vous
    const createdAppointment = await appointment.save();
    
    // Envoyer une notification au médecin
    await notificationService.notifyAppointmentCreated(createdAppointment);
    
    // Planifier le rappel 1h avant le rendez-vous
    await notificationService.scheduleAppointmentReminders(createdAppointment);
    
    res.status(201).json(createdAppointment);
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du rendez-vous' });
  }
};

// @desc    Obtenir tous les rendez-vous (pour admin)
// @route   GET /api/appointments
// @access  Private/Admin
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('doctor', 'full_name')
      .populate({
        path: 'patient',
        select: 'first_name last_name',
        populate: { path: 'user', select: 'fullName email' }
      })
      .populate('availability')
      .sort({ createdAt: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les rendez-vous d'un patient
// @route   GET /api/appointments/patient
// @access  Private/Patient
exports.getPatientAppointments = async (req, res) => {
  try {
    console.log('Tentative de récupération des rendez-vous pour l\'utilisateur:', req.user._id);
    
    // Récupérer l'ID du patient
    const patient = await Patient.findOne({ user: req.user._id });
    console.log('Patient trouvé:', patient ? patient._id : 'Patient non trouvé');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    const { status } = req.query;
    console.log('Filtre par statut:', status || 'aucun filtre');

    let query = { patient: patient._id };
    
    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
    }
    
    console.log('Requête de recherche:', JSON.stringify(query));

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctor',
        select: 'first_name last_name full_name'
      })
      .populate({
        path: 'availability',
        select: 'date startTime endTime'
      })
      .sort({ createdAt: -1 });
    
    console.log('Rendez-vous trouvés:', appointments.length);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

// @desc    Obtenir les rendez-vous d'un médecin
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    console.log('Tentative de récupération des rendez-vous pour le médecin:', req.user._id);
    
    const doctor = await Doctor.findOne({ user: req.user._id });
    console.log('Médecin trouvé:', doctor ? doctor._id : 'Médecin non trouvé');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    const { status } = req.query;
    console.log('Filtre par statut:', status || 'aucun filtre');
    
    let query = { doctor: doctor._id };
    
    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
    }
    
    console.log('Requête de recherche:', JSON.stringify(query));
    
    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        select: 'first_name last_name'
      })
      .populate({
        path: 'availability',
        select: 'date startTime endTime'
      })
      .sort({ createdAt: -1 });
    
    console.log('Rendez-vous trouvés:', appointments.length);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous du médecin:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

// @desc    Obtenir un rendez-vous par ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'full_name doctor_image')
      .populate({
        path: 'patient',
        select: 'first_name last_name',
        populate: { path: 'user', select: 'fullName email' }
      })
      .populate('availability');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }
    
    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (
      req.user.role !== 'Admin' && 
      (!doctor || doctor._id.toString() !== appointment.doctor._id.toString()) &&
      (!patient || patient._id.toString() !== appointment.patient._id.toString())
    ) {
      return res.status(403).json({ message: 'Non autorisé à accéder à ce rendez-vous' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour le statut d'un rendez-vous
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, sessionLink } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }
    
    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (
      req.user.role !== 'Admin' && 
      (!doctor || doctor._id.toString() !== appointment.doctor.toString())
    ) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce rendez-vous' });
    }
    
    appointment.status = status || appointment.status;
    
    if (sessionLink) {
      appointment.sessionLink = sessionLink;
    }
    
    const updatedAppointment = await appointment.save();
    
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// La fonction de confirmation a été supprimée car les rendez-vous sont automatiquement confirmés après paiement par le patient
// La génération du lien Zoom sera gérée par le service de paiement

// @desc    Reprogrammer un rendez-vous
// @route   PUT /api/appointments/:id/reschedule
// @access  Private/Doctor
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { availabilityId } = req.body;
    if (!availabilityId) {
      return res.status(400).json({ message: 'Veuillez fournir un nouveau créneau de disponibilité' });
    }
    
    // Vérifier si la nouvelle disponibilité existe
    const newAvailability = await Availability.findById(availabilityId);
    if (!newAvailability) {
      return res.status(404).json({ message: 'Nouveau créneau de disponibilité non trouvé' });
    }
    
    // Vérifier si la disponibilité est déjà réservée pour un rendez-vous actif (non annulé)
    const existingActiveAppointment = await Appointment.findOne({
      availability: availabilityId,
      status: { $nin: ['cancelled'] } // Exclure les rendez-vous annulés
    });
    
    if (existingActiveAppointment) {
      return res.status(400).json({ message: 'Ce créneau est déjà réservé' });
    }
    
    // Trouver le rendez-vous
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }
    
    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || doctor._id.toString() !== appointment.doctor.toString()) {
      return res.status(403).json({ message: 'Non autorisé à reprogrammer ce rendez-vous' });
    }
    
    // Récupérer l'ancienne disponibilité pour les informations de notification
    const oldAvailability = await Availability.findById(appointment.availability);
    const oldDate = oldAvailability ? oldAvailability.date : '';
    const oldTime = oldAvailability ? oldAvailability.startTime : '';
    
    // Libérer l'ancien créneau
    if (oldAvailability) {
      oldAvailability.isBooked = false;
      await oldAvailability.save();
    }
    
    // Réserver le nouveau créneau
    newAvailability.isBooked = true;
    await newAvailability.save();
    
    // Mettre à jour le rendez-vous
    appointment.availability = availabilityId;
    appointment.status = 'rescheduled';
    
    const updatedAppointment = await appointment.save();
    
    // Envoyer une notification au patient
    await notificationService.notifyAppointmentRescheduled(updatedAppointment, oldDate, oldTime);
    
    // Reprogrammer le rappel 1h avant le rendez-vous
    await notificationService.scheduleAppointmentReminders(updatedAppointment);
    
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Erreur lors de la reprogrammation du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la reprogrammation du rendez-vous' });
  }
};

// @desc    Annuler un rendez-vous
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    // Récupérer l'ID du patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patient._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Vérifier si le rendez-vous peut être annulé (pas déjà passé)
    const availability = await Availability.findById(appointment.availability);
    const appointmentDate = new Date(`${availability.date}T${availability.startTime}`);
    
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'Impossible d\'annuler un rendez-vous passé' });
    }

    // Mettre à jour le statut du rendez-vous
    appointment.status = 'cancelled';
    
    // Traiter le remboursement si le rendez-vous a été payé
    if (appointment.paymentStatus === 'completed') {
      try {
        // Utiliser le service de remboursement partiel (80%)
        await paymentService.processPartialRefund(appointmentId);
      } catch (refundError) {
        console.error('Erreur lors du remboursement partiel:', refundError);
        // Continuer avec l'annulation même si le remboursement échoue
      }
    }
    
    await appointment.save();

    // Libérer le créneau de disponibilité
    availability.isBooked = false;
    await availability.save();
    
    // Envoyer une notification au médecin
    await notificationService.notifyAppointmentCancelled(appointment);

    res.status(200).json({ 
      message: 'Rendez-vous annulé avec succès',
      paymentStatus: appointment.paymentStatus
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'annulation du rendez-vous' });
  }
}; 