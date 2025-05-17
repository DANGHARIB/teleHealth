const Patient = require('../models/Patient');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

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

// @desc    Ajouter un médecin à la liste des médecins sauvegardés
// @route   POST /api/patients/save-doctor/:doctorId
// @access  Private (Patient only)
exports.saveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Vérifier que le doctorId est valide
    if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de médecin invalide' });
    }
    
    // Trouver le patient
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Vérifier si le médecin existe
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    // Vérifier si le médecin est déjà dans la liste des médecins sauvegardés
    if (patient.savedDoctors && patient.savedDoctors.includes(doctorId)) {
      return res.status(400).json({ message: 'Ce médecin est déjà dans vos favoris' });
    }
    
    // Ajouter le médecin à la liste des médecins sauvegardés
    patient.savedDoctors = patient.savedDoctors || [];
    patient.savedDoctors.push(doctorId);
    await patient.save();
    
    res.status(200).json({ 
      message: 'Médecin ajouté aux favoris avec succès',
      savedDoctors: patient.savedDoctors
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout du médecin aux favoris:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Supprimer un médecin de la liste des médecins sauvegardés
// @route   DELETE /api/patients/save-doctor/:doctorId
// @access  Private (Patient only)
exports.removeSavedDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Vérifier que le doctorId est valide
    if (!doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de médecin invalide' });
    }
    
    // Trouver le patient
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Vérifier si le médecin est dans la liste des médecins sauvegardés
    if (!patient.savedDoctors || !patient.savedDoctors.includes(doctorId)) {
      return res.status(400).json({ message: 'Ce médecin n\'est pas dans vos favoris' });
    }
    
    // Supprimer le médecin de la liste des médecins sauvegardés
    patient.savedDoctors = patient.savedDoctors.filter(id => id.toString() !== doctorId);
    await patient.save();
    
    res.status(200).json({ 
      message: 'Médecin supprimé des favoris avec succès',
      savedDoctors: patient.savedDoctors
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du médecin des favoris:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Récupérer la liste des médecins sauvegardés
// @route   GET /api/patients/saved-doctors
// @access  Private (Patient only)
exports.getSavedDoctors = async (req, res) => {
  try {
    // Trouver le patient
    const patient = await Patient.findOne({ user: req.user.id }).populate({
      path: 'savedDoctors',
      select: '_id full_name first_name last_name doctor_image experience specialization price'
    });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    res.status(200).json(patient.savedDoctors || []);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des médecins sauvegardés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Supprimer un patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    // Supprimer le document Patient
    await Patient.deleteOne({ _id: req.params.id });
    
    // Optionnel: supprimer également l'utilisateur associé
    // await User.findByIdAndDelete(patient.user);
    
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 