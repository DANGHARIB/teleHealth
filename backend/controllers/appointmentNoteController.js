const AppointmentNote = require('../models/AppointmentNote');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');

// @desc    Créer une note pour un rendez-vous
// @route   POST /api/appointment-notes
// @access  Private/Doctor
exports.createAppointmentNote = async (req, res) => {
  try {
    const { appointmentId, content, diagnosis, treatment, advice, followUp } = req.body;

    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }

    // Vérifier si le rendez-vous existe et appartient au médecin
    const appointment = await Appointment.findOne({ 
      _id: appointmentId,
      doctor: doctor._id
    }).populate('patient');

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé ou accès non autorisé.' });
    }

    // Vérifier si une note existe déjà pour ce rendez-vous
    const existingNote = await AppointmentNote.findOne({ appointment: appointmentId });
    if (existingNote) {
      return res.status(400).json({ message: 'Une note existe déjà pour ce rendez-vous.' });
    }

    // Créer la note
    const appointmentNote = new AppointmentNote({
      appointment: appointmentId,
      doctor: doctor._id,
      patient: appointment.patient._id,
      content,
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      advice: advice || '',
      followUp: followUp || ''
    });

    const savedNote = await appointmentNote.save();
    
    // Retourner la note créée avec les références peuplées
    const populatedNote = await AppointmentNote.findById(savedNote._id)
      .populate('appointment', 'slotStartTime slotEndTime')
      .populate('patient', 'first_name last_name');
    
    res.status(201).json(populatedNote);
  } catch (error) {
    logger.error('Erreur lors de la création de la note:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la note.' });
  }
};

// @desc    Mettre à jour une note existante
// @route   PUT /api/appointment-notes/:id
// @access  Private/Doctor
exports.updateAppointmentNote = async (req, res) => {
  try {
    const { content, diagnosis, treatment, advice, followUp } = req.body;
    
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Vérifier si la note existe et appartient au médecin
    const note = await AppointmentNote.findOne({
      _id: req.params.id,
      doctor: doctor._id
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée ou accès non autorisé.' });
    }
    
    // Mettre à jour la note
    note.content = content || note.content;
    note.diagnosis = diagnosis !== undefined ? diagnosis : note.diagnosis;
    note.treatment = treatment !== undefined ? treatment : note.treatment;
    note.advice = advice !== undefined ? advice : note.advice;
    note.followUp = followUp !== undefined ? followUp : note.followUp;
    
    const updatedNote = await note.save();
    
    // Retourner la note mise à jour avec les références peuplées
    const populatedNote = await AppointmentNote.findById(updatedNote._id)
      .populate('appointment', 'slotStartTime slotEndTime')
      .populate('patient', 'first_name last_name');
    
    res.status(200).json(populatedNote);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la note:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la note.' });
  }
};

// @desc    Récupérer toutes les notes d'un médecin
// @route   GET /api/appointment-notes
// @access  Private/Doctor
exports.getDoctorNotes = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Récupérer toutes les notes du médecin
    const notes = await AppointmentNote.find({ doctor: doctor._id })
      .populate({
        path: 'appointment',
        select: 'slotStartTime slotEndTime status availability',
        populate: {
          path: 'availability',
          select: 'date'
        }
      })
      .populate('patient', 'first_name last_name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(notes);
  } catch (error) {
    logger.error('Erreur lors de la récupération des notes:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notes.' });
  }
};

// @desc    Récupérer toutes les notes pour un patient spécifique
// @route   GET /api/appointment-notes/patient/:patientId
// @access  Private/Doctor
exports.getPatientNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Récupérer toutes les notes du médecin pour ce patient
    const notes = await AppointmentNote.find({
      doctor: doctor._id,
      patient: patientId
    })
      .populate({
        path: 'appointment',
        select: 'slotStartTime slotEndTime status availability',
        populate: {
          path: 'availability',
          select: 'date'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json(notes);
  } catch (error) {
    logger.error('Erreur lors de la récupération des notes du patient:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notes du patient.' });
  }
};

// @desc    Récupérer une note spécifique
// @route   GET /api/appointment-notes/:id
// @access  Private/Doctor
exports.getNoteById = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Récupérer la note et vérifier qu'elle appartient au médecin
    const note = await AppointmentNote.findOne({
      _id: req.params.id,
      doctor: doctor._id
    })
      .populate({
        path: 'appointment',
        select: 'slotStartTime slotEndTime status availability caseDetails',
        populate: {
          path: 'availability',
          select: 'date'
        }
      })
      .populate('patient', 'first_name last_name gender date_of_birth');
    
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée ou accès non autorisé.' });
    }
    
    res.status(200).json(note);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la note:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la note.' });
  }
};

// @desc    Supprimer une note
// @route   DELETE /api/appointment-notes/:id
// @access  Private/Doctor
exports.deleteNote = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Trouver et supprimer la note
    const note = await AppointmentNote.findOneAndDelete({
      _id: req.params.id,
      doctor: doctor._id
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note non trouvée ou accès non autorisé.' });
    }
    
    res.status(200).json({ message: 'Note supprimée avec succès.' });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la note:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la note.' });
  }
};

// @desc    Vérifier si une note existe pour un rendez-vous spécifique
// @route   GET /api/appointment-notes/check/:appointmentId
// @access  Private/Doctor
exports.checkNoteExists = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Vérifier si l'utilisateur est un médecin
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Accès non autorisé. Profil médecin requis.' });
    }
    
    // Vérifier si une note existe
    const note = await AppointmentNote.findOne({
      appointment: appointmentId,
      doctor: doctor._id
    });
    
    res.status(200).json({
      exists: note ? true : false,
      noteId: note ? note._id : null
    });
  } catch (error) {
    logger.error('Erreur lors de la vérification de la note:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification de la note.' });
  }
}; 