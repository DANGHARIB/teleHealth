const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Obtenir tous les utilisateurs (filtrage par rôle possible)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un utilisateur par ID (et son profil patient/docteur si applicable)
// @route   GET /api/users/:id
// @access  Private/Admin (ou utilisateur concerné, à ajuster si besoin)
exports.getUserById = async (req, res) => {
  try {
    // TODO: Ajouter une vérification ici si l'utilisateur non-admin demande ses propres infos
    // if (req.user.role !== 'Admin' && req.user._id.toString() !== req.params.id) {
    //   return res.status(403).json({ message: 'Accès non autorisé' });
    // }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    let profileData = null;
    
    if (user.role === 'Patient') {
      profileData = await Patient.findOne({ user: user._id });
    } else if (user.role === 'Doctor') {
      profileData = await Doctor.findOne({ user: user._id }).populate('specialization');
    }
    
    res.json({
      ...user.toJSON(), // Utiliser toJSON() pour s'assurer que les virtuals sont inclus si définis
      profile: profileData ? profileData.toJSON() : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour un utilisateur (par Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Seuls les admins peuvent modifier ces champs directement
    const { fullName, email, role, profileStatus, verified } = req.body;
    
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (profileStatus) user.profileStatus = profileStatus;
    if (verified !== undefined) user.verified = verified;
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      profileStatus: updatedUser.profileStatus,
      verified: updatedUser.verified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await user.deleteOne(); // Remplacé user.remove() par user.deleteOne()
    
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enregistrer le token d'appareil pour les notifications
// @route   POST /api/users/device-token
// @access  Private
exports.registerDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }
    
    // Mise à jour du token dans la base de données
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.deviceToken = token;
    await user.save();
    
    // Enregistrer également dans le service de notification (pour la compatibilité actuelle)
    const notificationService = require('../services/notificationService');
    notificationService.registerDeviceToken(req.user._id, token);
    
    res.status(200).json({ message: 'Token enregistré avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du token d\'appareil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 