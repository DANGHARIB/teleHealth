const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Obtenir tous les patients
// @route   GET /api/patients
// @access  Private/Admin
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({})
      .populate('user', 'fullName email verified')
      .sort({ createdAt: -1 });
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un patient par ID de Patient
// @route   GET /api/patients/:id
// @access  Private
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', 'fullName email verified');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Vérifier l'autorisation (admin ou le patient lui-même)
    if (
      req.user.role !== 'Admin' && 
      patient.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Non autorisé à accéder à ce profil' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir le profil du patient connecté (User + Patient)
// @route   GET /api/patients/profile
// @access  Private/Patient
exports.getPatientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const patientProfile = await Patient.findOne({ user: req.user._id });
    if (!patientProfile) {
      // This case might mean the patient profile part was not created yet, though typically it should exist.
      // Depending on app logic, you might return default/empty patient profile or an error.
      // For now, returning user data and null/empty for profile part.
      return res.json({ user: user.toJSON(), profile: null });
    }

    res.json({ user: user.toJSON(), profile: patientProfile.toJSON() });

  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil patient.' });
  }
};

// @desc    Mettre à jour le profil d'un patient (User.fullName + Patient specific fields)
// @route   PUT /api/patients/profile
// @access  Private/Patient
exports.updatePatientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé pour la mise à jour.'});
    }

    const { fullName, first_name, last_name, gender, date_of_birth } = req.body;

    // Update User model
    if (fullName) {
      user.fullName = fullName;
    }
    // If first_name and last_name are provided, and fullName is empty or user wants to sync it
    // We could also update user.fullName based on first_name and last_name if desired
    // For now, only explicit fullName update.
    await user.save();

    // Update Patient model
    let patient = await Patient.findOne({ user: req.user._id });
    
    if (!patient) {
      // This case should ideally not happen if a patient record is created upon registration
      // If it can, create a new one:
      // patient = new Patient({ user: req.user._id, first_name, last_name, gender, date_of_birth });
      return res.status(404).json({ message: 'Profil de patient non trouvé pour la mise à jour.'});
    }
    
    if (first_name) patient.first_name = first_name;
    if (last_name) patient.last_name = last_name;
    if (gender) patient.gender = gender;
    if (date_of_birth) patient.date_of_birth = new Date(date_of_birth);
    
    const updatedPatient = await patient.save();
    
    // Return comprehensive user info, similar to login/register response
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      verified: user.verified,
      profileStatus: user.profileStatus, // Assuming this is on User model
      hasCompletedAssessment: user.hasCompletedAssessment, // Assuming this is on User model
      // Add any other fields from User model that are part of `userInfo` in AsyncStorage
      profile: updatedPatient.toJSON()
    });

  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil patient.', details: error.message });
  }
};

// @desc    Marquer un patient comme ayant pris l'évaluation
// @route   PUT /api/patients/mark-assessment
// @access  Private/Patient
exports.markAssessment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Profil de patient non trouvé' });
    }
    
    patient.has_taken_assessment = true;
    const updatedPatient = await patient.save();
    
    res.json({
      message: "Le patient a été marqué comme ayant pris l'évaluation",
      patient: updatedPatient
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 