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

// @desc    Obtenir un patient par ID
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

// @desc    Mettre à jour le profil d'un patient
// @route   PUT /api/patients/profile
// @access  Private/Patient
exports.updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Profil de patient non trouvé' });
    }
    
    const { first_name, last_name, gender, date_of_birth } = req.body;
    
    if (first_name) patient.first_name = first_name;
    if (last_name) patient.last_name = last_name;
    if (gender) patient.gender = gender;
    if (date_of_birth) patient.date_of_birth = date_of_birth;
    
    const updatedPatient = await patient.save();
    
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      message: 'Le patient a été marqué comme ayant pris l\'évaluation',
      patient: updatedPatient
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 