const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Specialization = require('../models/Specialization');
const logger = require('../config/logger');
const Patient = require('../models/Patient');

// @desc    Obtenir tous les médecins
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { specialization, verified, search } = req.query;
    
    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }
    
    // Recherche par nom
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } }
      ];
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
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const doctorProfile = await Doctor.findOne({ user: req.user.id })
                                  // .populate('specialization', 'name') // Décommenter si besoin
                                  // .populate('specializations', 'name'); // Décommenter si besoin

    if (!doctorProfile) {
      // Si le profil docteur n'existe pas encore, retourner les infos user et un profil vide/null
      // Cela peut arriver si le document Doctor n'est pas créé à l'inscription du User de type Doctor
      logger.warn(`Profil docteur non trouvé pour l'utilisateur: ${user.email}, création d'un profil vide implicite pour la réponse.`);
      // On pourrait créer un profil vide ici si la logique le requiert:
      // const newDoctorProfile = new Doctor({ user: user._id, first_name: user.fullName.split(' ')[0], last_name: user.fullName.split(' ').slice(1).join(' ') });
      // await newDoctorProfile.save();
      // return res.json({ user: user.toJSON(), profile: newDoctorProfile.toJSON() });
      return res.json({ user: user.toJSON(), profile: null }); // ou un objet profile avec des valeurs par défaut
    }

    // Assurer que le profil retourné contient bien les champs attendus par le front
    // notamment si first_name, last_name ne sont pas encore peuplés dans le Doctor model
    // pour d'anciens docteurs, on peut essayer de les déduire de user.fullName
    const profileData = doctorProfile.toJSON();
    if (!profileData.first_name && user.fullName) {
        profileData.first_name = user.fullName.split(' ')[0] || '';
    }
    if (!profileData.last_name && user.fullName) {
        const nameParts = user.fullName.split(' ');
        profileData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }


    res.json({ user: user.toJSON(), profile: profileData });

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
    const {
      first_name,
      last_name,
      date_of_birth, 
      specialization, 
      bio, 
      address, 
      phone, 
      consultation_fees,
      education,
      experience,
      price
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn(`Utilisateur non trouvé pour la mise à jour du profil docteur: ${req.user.id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      logger.info(`Profil docteur non trouvé pour l'utilisateur: ${user.email}. Création d'un nouveau profil docteur.`);
      // Si le profil n'existe pas, on le crée
      doctor = new Doctor({ user: user._id });
    }

    // Mettre à jour le modèle User si first_name ou last_name sont fournis
    let currentFullName = user.fullName;
    if (first_name && last_name) {
      const newFullName = `${first_name.trim()} ${last_name.trim()}`.trim();
      if (user.fullName !== newFullName) {
        user.fullName = newFullName;
      }
    } else if (first_name && !last_name) {
      // Si seul le prénom est fourni, on peut MAJ le prénom et garder l'ancien nom pour le fullName
      const nameParts = user.fullName ? user.fullName.split(' ') : [];
      const oldLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      user.fullName = `${first_name.trim()} ${oldLastName}`.trim();
    } else if (!first_name && last_name) {
      // Si seul le nom est fourni
      const oldFirstName = user.fullName ? user.fullName.split(' ')[0] : '';
      user.fullName = `${oldFirstName} ${last_name.trim()}`.trim();
    }
    // Sauvegarde de l'utilisateur si son fullName a changé
    if (user.fullName !== currentFullName) {
        await user.save();
    }

    // Mettre à jour le modèle Doctor
    if (first_name) doctor.first_name = first_name.trim();
    if (last_name) doctor.last_name = last_name.trim();
    // Assigner doctor.full_name également, pour la cohérence si ce champ est utilisé ailleurs
    doctor.full_name = user.fullName; 

    if (date_of_birth) doctor.dob = date_of_birth; // Map date_of_birth to the dob field in model
    
    // Vérifier si la spécialisation est un ID valide avant de l'assigner
    if (specialization) {
      try {
        const specExists = await Specialization.findById(specialization);
        if (specExists) {
          doctor.specialization = specialization;
        } else {
          logger.warn(`Spécialisation non trouvée pour l'ID: ${specialization}`);
        }
      } catch (error) {
        logger.warn(`Erreur lors de la validation de la spécialisation: ${error.message}`);
      }
    }
    
    // Map bio to about field in model
    if (bio) doctor.about = bio;
    
    // Handle education field properly
    if (education) doctor.education = education;
    
    // Experience can come from either experience or may need conversion
    if (experience !== undefined) {
      doctor.experience = Number(experience);
    }
    
    // Price can come from either price or consultation_fees field
    if (price !== undefined) {
      doctor.price = Number(price);
    } else if (consultation_fees !== undefined) {
      doctor.price = Number(consultation_fees);
    }
    
    // Handle non-schema fields (if needed in the future, could add to schema)
    if (address) doctor.address = address; 
    if (phone) doctor.phone = phone;

    // Handle uploaded certification files
    if (req.files && req.files.length > 0) {
      const certificationFilePaths = req.files.map(file => {
        // Convert absolute path to relative path for proper URL construction
        return file.path.includes('\\uploads\\') || file.path.includes('/uploads/') 
          ? '/uploads/' + file.path.split(/[\\\/]uploads[\\\/]/).pop() 
          : '/uploads/' + file.path.split(/[\\\/]/).pop();
      });
      doctor.certifications = certificationFilePaths;
    }

    const updatedDoctorProfile = await doctor.save();
    
    // Populate user details pour la réponse complète, similaire à la réponse de login/register
    // Pour que le client (AsyncStorage) ait toutes les infos à jour
    const updatedUser = await User.findById(req.user.id).select('-password'); // Re-fetch user for latest state
    
    // Populate the specialization reference
    await updatedDoctorProfile.populate('specialization');

    logger.info(`Profil docteur mis à jour pour: ${user.email}`);
    res.json({
        user: updatedUser.toJSON(),
        profile: updatedDoctorProfile.toJSON()
    });

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
    
    // Convert absolute path to relative path for proper URL construction
    const relativePath = req.file.path.includes('\\uploads\\') || req.file.path.includes('/uploads/') 
      ? '/uploads/' + req.file.path.split(/[\\\/]uploads[\\\/]/).pop() 
      : '/uploads/' + req.file.path.split(/[\\\/]/).pop();
    
    doctor.doctor_image = relativePath;
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
    
    // Convert absolute path to relative path for proper URL construction
    const relativePath = req.file.path.includes('\\uploads\\') || req.file.path.includes('/uploads/') 
      ? '/uploads/' + req.file.path.split(/[\\\/]uploads[\\\/]/).pop() 
      : '/uploads/' + req.file.path.split(/[\\\/]/).pop();
    
    doctor.certification_path = relativePath;
    const updatedDoctor = await doctor.save();
    
    res.json({
      message: 'Certificat téléchargé avec succès',
      doctor: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les patients qui ont sauvegardé le médecin connecté
// @route   GET /api/doctors/saved-patients
// @access  Private (Doctor only)
exports.getSavedPatients = async (req, res) => {
  try {
    // Récupérer l'ID du médecin connecté
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Profil médecin non trouvé' });
    }
    
    // Trouver tous les patients qui ont ce docteur dans leur liste de médecins sauvegardés
    const patients = await Patient.find({ savedDoctors: doctor._id })
      .populate('user', 'fullName email')
      .select('_id first_name last_name gender date_of_birth has_taken_assessment');
    
    res.json(patients);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des patients qui ont sauvegardé le médecin: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Rechercher parmi les patients qui ont sauvegardé le médecin connecté
// @route   GET /api/doctors/search-patients
// @access  Private (Doctor only)
exports.searchSavedPatients = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Récupérer l'ID du médecin connecté
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Profil médecin non trouvé' });
    }
    
    // Construire la requête de recherche
    let query = { savedDoctors: doctor._id };
    
    // Ajouter la recherche par nom si un terme de recherche est fourni
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Trouver les patients correspondants aux critères
    const patients = await Patient.find(query)
      .populate('user', 'fullName email')
      .select('_id first_name last_name gender date_of_birth has_taken_assessment');
    
    res.json(patients);
  } catch (error) {
    logger.error(`Erreur lors de la recherche des patients: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Rechercher des médecins par nom
// @route   GET /api/doctors/search
// @access  Public
exports.searchDoctors = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }
    
    let query = {
      $or: [
        { full_name: { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } }
      ]
    };
    
    const doctors = await Doctor.find(query)
      .populate('user', 'fullName email')
      .populate('specialization', 'name')
      .sort({ createdAt: -1 });
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir le nombre de patients associés à un médecin
// @route   GET /api/doctors/:id/patients/count
// @access  Private/Admin
exports.getDoctorPatientCount = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // Vérifier que le médecin existe
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    
    // Compter les patients qui ont ce médecin dans leur liste de médecins sauvegardés
    const patientCount = await Patient.countDocuments({ savedDoctors: doctorId });
    
    // Renvoyer les statistiques
    res.json({
      doctorId,
      patientCount,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Erreur lors du comptage des patients pour le médecin: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 