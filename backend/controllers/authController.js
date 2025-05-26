const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { sendOtpEmail, sendDoctorRegistrationNotification } = require('../services/emailService');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'votre_secret_jwt_securise', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Générer un code OTP à 4 chiffres
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Inscription utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    logger.info(`Tentative d'inscription avec email: ${req.body.email}, rôle: ${req.body.role}`);
    
    const { fullName, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`Échec d'inscription: email ${email} existe déjà`);
      return res.status(400).json({ message: 'Utilisateur existe déjà' });
    }

    // Générer un code OTP
    const otpCode = generateOTP();
    logger.debug(`Code OTP généré: ${otpCode} pour l'utilisateur ${email}`);

    // Créer un nouvel utilisateur
    logger.info(`Création d'un nouvel utilisateur: ${email}`);
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      otp_code: otpCode
    });

    // Créer le profil patient ou docteur selon le rôle
    if (role === 'Patient') {
      logger.info(`Création du profil patient pour l'utilisateur ${email}`);
      await Patient.create({
        user: user._id,
      });
    } else if (role === 'Doctor') {
      logger.info(`Création du profil médecin pour l'utilisateur ${email}`);
      let doctorProfile;
      try {
        doctorProfile = await Doctor.create({
          user: user._id,
          full_name: fullName,
          specialization: req.body.specializationId || null
        });
        
        // Envoyer un email au médecin pour lui indiquer que son compte est en cours de vérification
        try {
          await sendDoctorRegistrationNotification({
            full_name: fullName,
            user: { email }
          });
          logger.info(`Email de notification envoyé au médecin ${email}`);
        } catch (emailError) {
          logger.error(`Erreur lors de l'envoi de l'email de notification au médecin: ${emailError.message}`);
          // On continue même si l'envoi d'email échoue
        }
      } catch (error) {
        logger.error(`Erreur lors de la création du profil médecin: ${error.message}`);
        // Supprimer l'utilisateur si la création du profil médecin échoue
        await User.findByIdAndDelete(user._id);
        throw error;
      }
    }

    // Envoyer le code OTP par email
    try {
      await sendOtpEmail(email, otpCode);
      logger.info(`Code OTP envoyé par email à ${email}`);
    } catch (emailError) {
      logger.error(`Erreur lors de l'envoi de l'email OTP à ${email}: ${emailError.message}`);
      // On continue même si l'envoi d'email échoue
    }
    logger.info(`Utilisateur ${email} inscrit avec succès, OTP: ${otpCode}`);

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    logger.error(`Erreur lors de l'inscription: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vérifier le code OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    logger.info(`Tentative de vérification OTP pour l'email: ${req.body.email}`);
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      logger.warn(`Vérification OTP échouée: utilisateur ${email} non trouvé`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    logger.debug(`Code OTP saisi: ${otp}, code attendu: ${user.otp_code}`);
    if (user.otp_code !== otp) {
      logger.warn(`Vérification OTP échouée: code invalide pour ${email}`);
      return res.status(400).json({ message: 'Code OTP invalide' });
    }

    // Marquer l'utilisateur comme vérifié
    user.verified = true;
    user.otp_code = null;
    await user.save();
    logger.info(`Utilisateur ${email} vérifié avec succès`);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      verified: user.verified,
      token: generateToken(user._id)
    });
  } catch (error) {
    logger.error(`Erreur lors de la vérification OTP: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    logger.info(`Tentative de connexion avec email: ${req.body.email}`);
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      let profileData = null;

      // Récupérer les données de profil selon le rôle
      if (user.role === 'Patient') {
        profileData = await Patient.findOne({ user: user._id });
      } else if (user.role === 'Doctor') {
        profileData = await Doctor.findOne({ user: user._id }).populate('specialization');
        
        // Bloquer l'accès si le médecin n'est pas vérifié (sauf pour l'application d'administration)
        if (!req.body.isAdminApp && !profileData.verified && profileData.verificationStatus !== 'verified') {
          logger.warn(`Tentative de connexion refusée: médecin ${email} non vérifié`);
          return res.status(403).json({ 
            message: 'Votre compte est en cours de vérification par notre équipe. Vous recevrez une notification dès que votre profil sera validé.',
            verificationStatus: profileData.verificationStatus,
            notVerified: true
          });
        }
        
        // Si le statut est 'rejected', fournir la raison du rejet
        if (profileData.verificationStatus === 'rejected') {
          logger.warn(`Tentative de connexion refusée: médecin ${email} rejeté`);
          return res.status(403).json({
            message: 'Votre demande a été rejetée.',
            rejectionReason: profileData.rejectionReason,
            verificationStatus: 'rejected',
            rejected: true
          });
        }
      }

      logger.info(`Connexion réussie pour l'utilisateur ${email}`);
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verified: user.verified,
        hasCompletedAssessment: user.hasCompletedAssessment,
        profileStatus: user.profileStatus,
        profile: profileData,
        token: generateToken(user._id)
      });
    } else {
      logger.warn(`Échec de connexion pour l'email ${email}`);
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    logger.error(`Erreur lors de la connexion: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir le profil utilisateur
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    logger.info(`Récupération du profil pour l'utilisateur ${req.user._id}`);
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      logger.warn(`Profil non trouvé pour l'utilisateur ${req.user._id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let profileData = null;

    // Récupérer les données de profil selon le rôle
    if (user.role === 'Patient') {
      profileData = await Patient.findOne({ user: user._id });
    } else if (user.role === 'Doctor') {
      profileData = await Doctor.findOne({ user: user._id }).populate('specialization');
    }

    logger.info(`Profil récupéré avec succès pour l'utilisateur ${req.user._id}`);
    res.json({
      ...user.toJSON(),
      profile: profileData
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Renvoyer le code OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    logger.info(`Demande de renvoi d'OTP pour l'email: ${req.body.email}`);
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      logger.warn(`Renvoi OTP échoué: utilisateur ${email} non trouvé`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.verified) {
      logger.warn(`Renvoi OTP échoué: utilisateur ${email} déjà vérifié`);
      return res.status(400).json({ message: 'Utilisateur déjà vérifié' });
    }

    // Générer un nouveau code OTP
    const otpCode = generateOTP();
    logger.debug(`Nouveau code OTP généré: ${otpCode} pour l'utilisateur ${email}`);

    user.otp_code = otpCode;
    await user.save();

    // Envoyer le code OTP par email
    try {
      await sendOtpEmail(email, otpCode);
      logger.info(`Nouveau code OTP envoyé par email à ${email}`);
    } catch (emailError) {
      logger.error(`Erreur lors de l'envoi de l'email OTP à ${email}: ${emailError.message}`);
      // On continue même si l'envoi d'email échoue
    }
    logger.info(`Nouveau code OTP envoyé à l'utilisateur ${email}`);

    res.json({ message: 'Code OTP renvoyé avec succès' });
  } catch (error) {
    logger.error(`Erreur lors du renvoi d'OTP: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: error.message });
  }
}; 