const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Specialization = require('../models/Specialization');
const logger = require('../config/logger');

// @desc    Obtenir tous les médecins
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { specialization, verified } = req.query;
    
    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }
    
    const doctors = await Doctor.find(query)
      .populate('user', 'fullName email')
      .populate('specialization', 'name')
      .sort({ createdAt: -1 });
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un médecin par ID
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'fullName email')
      .populate('specialization', 'name')
      .populate('specializations', 'name');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id }).populate('user', 'fullName email role');
    if (!doctor) {
      return res.status(404).json({ message: 'Profil docteur non trouvé' });
    }
    res.json(doctor);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil docteur: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { full_name, date_of_birth, specialization, bio, address, phone, consultation_fees, certifications } = req.body;

    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      logger.warn(`Tentative de mise à jour d'un profil docteur non trouvé pour l'utilisateur: ${req.user.id}`);
      return res.status(404).json({ message: 'Profil docteur non trouvé' });
    }

    // Update User model if full_name is provided and different
    if (full_name && req.user.fullName !== full_name) {
      await User.findByIdAndUpdate(req.user.id, { fullName: full_name });
    }

    // Update Doctor model
    doctor.full_name = full_name || doctor.full_name; // Ensure existing full_name is kept if not provided
    if (date_of_birth) doctor.date_of_birth = date_of_birth;
    if (specialization) doctor.specialization = specialization; // Assuming specialization is an ID or string
    if (bio) doctor.bio = bio;
    if (address) doctor.address = address; // You might want a more structured address object
    if (phone) doctor.phone = phone;
    if (consultation_fees) doctor.consultation_fees = consultation_fees;
    if (certifications) doctor.certifications = certifications; // Simple text for now
    // TODO: Handle file uploads for certifications if needed

    const updatedDoctor = await doctor.save();

    // Populate user details for the response
    await updatedDoctor.populate('user', 'fullName email role');
    
    logger.info(`Profil docteur mis à jour pour: ${req.user.email}`);
    res.json(updatedDoctor);

  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du profil docteur: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
  }
};

// @desc    Vérifier un médecin
// @route   PUT /api/doctors/:id/verify
// @access  Private/Admin
exports.verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    doctor.verified = true;
    const updatedDoctor = await doctor.save();
    
    // Mettre à jour le statut du profil utilisateur
    await User.findByIdAndUpdate(doctor.user, { profileStatus: 'approved' });
    
    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Télécharger une image de profil pour un médecin
// @route   PUT /api/doctors/upload-image
// @access  Private/Doctor
exports.uploadProfileImage = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Veuillez télécharger une image' });
    }
    
    doctor.doctor_image = req.file.path;
    const updatedDoctor = await doctor.save();
    
    res.json({
      message: 'Image téléchargée avec succès',
      doctor: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Télécharger un certificat pour un médecin
// @route   PUT /api/doctors/upload-certificate
// @access  Private/Doctor
exports.uploadCertificate = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Veuillez télécharger un certificat' });
    }
    
    doctor.certification_path = req.file.path;
    const updatedDoctor = await doctor.save();
    
    res.json({
      message: 'Certificat téléchargé avec succès',
      doctor: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 