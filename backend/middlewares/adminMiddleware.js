const logger = require('../config/logger');

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 * À utiliser après le middleware d'authentification (protect)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    logger.info(`Accès administrateur autorisé pour l'utilisateur ${req.user._id}`);
    next();
  } else {
    logger.warn(`Tentative d'accès administrateur refusée pour l'utilisateur ${req.user ? req.user._id : 'inconnu'}`);
    res.status(403).json({ message: 'Accès refusé. Autorisation d\'administrateur requise.' });
  }
}; 