const AppointmentNote = require('../models/AppointmentNote');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const logger = require('../config/logger');

// @desc    Create a note for an appointment
// @route   POST /api/appointment-notes
// @access  Private/Doctor
exports.createAppointmentNote = async (req, res) => {
  try {
    const { appointmentId, content, diagnosis, treatment, advice, followUp } = req.body;

    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }

    // Check if the appointment exists and belongs to the doctor
    const appointment = await Appointment.findOne({ 
      _id: appointmentId,
      doctor: doctor._id
    }).populate('patient');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized access.' });
    }

    // Check if a note already exists for this appointment
    const existingNote = await AppointmentNote.findOne({ appointment: appointmentId });
    if (existingNote) {
      return res.status(400).json({ message: 'A note already exists for this appointment.' });
    }

    // Prepare note data with default values to avoid errors
    const safeContent = content || '';
    const safeDiagnosis = diagnosis || '';
    const safeTreatment = treatment || '';
    const safeAdvice = advice || '';
    const safeFollowUp = followUp || '';

    // Create the note
    const appointmentNote = new AppointmentNote({
      appointment: appointmentId,
      doctor: doctor._id,
      patient: appointment.patient._id,
      content: safeContent,
      diagnosis: safeDiagnosis,
      treatment: safeTreatment,
      advice: safeAdvice,
      followUp: safeFollowUp
    });

    try {
      const savedNote = await appointmentNote.save();
      
      // Return the created note with populated references
      const populatedNote = await AppointmentNote.findById(savedNote._id)
        .populate('appointment', 'slotStartTime slotEndTime')
        .populate('patient', 'first_name last_name');
      
      res.status(201).json(populatedNote);
    } catch (saveError) {
      logger.error('Error saving note:', saveError);
      res.status(500).json({ 
        message: 'Server error while creating note.',
        details: process.env.NODE_ENV === 'development' ? saveError.message : undefined
      });
    }
  } catch (error) {
    logger.error('Error creating note:', error);
    res.status(500).json({ 
      message: 'Server error while creating note.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update an existing note
// @route   PUT /api/appointment-notes/:id
// @access  Private/Doctor
exports.updateAppointmentNote = async (req, res) => {
  try {
    const { content, diagnosis, treatment, advice, followUp } = req.body;
    
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Check if the note exists and belongs to the doctor
    const note = await AppointmentNote.findOne({
      _id: req.params.id,
      doctor: doctor._id
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized access.' });
    }
    
    // Update the note
    note.content = content || note.content;
    note.diagnosis = diagnosis !== undefined ? diagnosis : note.diagnosis;
    note.treatment = treatment !== undefined ? treatment : note.treatment;
    note.advice = advice !== undefined ? advice : note.advice;
    note.followUp = followUp !== undefined ? followUp : note.followUp;
    
    const updatedNote = await note.save();
    
    // Return the updated note with populated references
    const populatedNote = await AppointmentNote.findById(updatedNote._id)
      .populate('appointment', 'slotStartTime slotEndTime')
      .populate('patient', 'first_name last_name');
    
    res.status(200).json(populatedNote);
  } catch (error) {
    logger.error('Error updating note:', error);
    res.status(500).json({ message: 'Server error while updating note.' });
  }
};

// @desc    Get all notes for a doctor
// @route   GET /api/appointment-notes
// @access  Private/Doctor
exports.getDoctorNotes = async (req, res) => {
  try {
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Get all notes for the doctor
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
    logger.error('Error retrieving notes:', error);
    res.status(500).json({ message: 'Server error while retrieving notes.' });
  }
};

// @desc    Get all notes for a specific patient
// @route   GET /api/appointment-notes/patient/:patientId
// @access  Private/Doctor
exports.getPatientNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Get all notes from the doctor for this patient
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
    logger.error('Error retrieving patient notes:', error);
    res.status(500).json({ message: 'Server error while retrieving patient notes.' });
  }
};

// @desc    Get a specific note
// @route   GET /api/appointment-notes/:id
// @access  Private/Doctor
exports.getNoteById = async (req, res) => {
  try {
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Get the note and verify it belongs to the doctor
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
      return res.status(404).json({ message: 'Note not found or unauthorized access.' });
    }
    
    res.status(200).json(note);
  } catch (error) {
    logger.error('Error retrieving note:', error);
    res.status(500).json({ message: 'Server error while retrieving note.' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/appointment-notes/:id
// @access  Private/Doctor
exports.deleteNote = async (req, res) => {
  try {
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Find and delete the note
    const note = await AppointmentNote.findOneAndDelete({
      _id: req.params.id,
      doctor: doctor._id
    });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized access.' });
    }
    
    res.status(200).json({ message: 'Note successfully deleted.' });
  } catch (error) {
    logger.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error while deleting note.' });
  }
};

// @desc    Check if a note exists for a specific appointment
// @route   GET /api/appointment-notes/check/:appointmentId
// @access  Private/Doctor
exports.checkNoteExists = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Check if the user is a doctor
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Unauthorized access. Doctor profile required.' });
    }
    
    // Check if a note exists
    const note = await AppointmentNote.findOne({
      appointment: appointmentId,
      doctor: doctor._id
    });
    
    res.status(200).json({
      exists: note ? true : false,
      noteId: note ? note._id : null
    });
  } catch (error) {
    logger.error('Error checking note:', error);
    res.status(500).json({ message: 'Server error while checking note.' });
  }
}; 