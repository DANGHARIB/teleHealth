const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

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
    
    // Vérifier si la disponibilité existe et n'est pas déjà réservée
    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilité non trouvée' });
    }
    
    if (availability.isBooked) {
      return res.status(400).json({ message: 'Cette plage horaire est déjà réservée' });
    }
    
    // Trouver le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Créer le rendez-vous
    const appointment = new Appointment({
      doctor: doctorId,
      patient: patient._id,
      availability: availabilityId,
      price,
      duration,
      caseDetails
    });
    
    // Marquer la disponibilité comme réservée
    availability.isBooked = true;
    await availability.save();
    
    // Sauvegarder le rendez-vous
    const createdAppointment = await appointment.save();
    
    res.status(201).json(createdAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'full_name doctor_image')
      .populate('availability')
      .sort({ createdAt: -1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les rendez-vous d'un médecin
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    const appointments = await Appointment.find({ doctor: doctor._id })
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

// @desc    Annuler un rendez-vous
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }
    
    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (
      req.user.role !== 'Admin' && 
      (!doctor || doctor._id.toString() !== appointment.doctor.toString()) &&
      (!patient || patient._id.toString() !== appointment.patient.toString())
    ) {
      return res.status(403).json({ message: 'Non autorisé à annuler ce rendez-vous' });
    }
    
    // Mettre à jour le statut du rendez-vous
    appointment.status = 'cancelled';
    await appointment.save();
    
    // Libérer la disponibilité
    await Availability.findByIdAndUpdate(appointment.availability, { isBooked: false });
    
    res.json({ message: 'Rendez-vous annulé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 