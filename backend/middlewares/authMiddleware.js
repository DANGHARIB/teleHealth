const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extraire le token du header
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_securise');

      // Assigner l'utilisateur à req.user sans le mot de passe
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, aucun token' });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, accès réservé aux administrateurs' });
  }
};

// Middleware pour vérifier si l'utilisateur est médecin
exports.doctor = (req, res, next) => {
  if (req.user && req.user.role === 'Doctor') {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, accès réservé aux médecins' });
  }
};

// Middleware pour vérifier si l'utilisateur est patient
exports.patient = (req, res, next) => {
  if (req.user && req.user.role === 'Patient') {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, accès réservé aux patients' });
  }
}; 