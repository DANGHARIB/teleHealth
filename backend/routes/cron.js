const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const appointmentCleanupService = require('../services/appointmentCleanupService');

/**
 * @route   POST /api/cron/cleanup-appointments
 * @desc    Nettoie les rendez-vous en attente non payés
 * @access  Private/Admin
 */
router.post('/cleanup-appointments', protect, admin, async (req, res) => {
  try {
    const { minutes } = req.body;
    const result = await appointmentCleanupService.cleanupPendingAppointments(minutes || 30);
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de l\'exécution du nettoyage:', error);
    res.status(500).json({ 
      message: 'Erreur lors du nettoyage des rendez-vous en attente',
      error: error.message 
    });
  }
});

module.exports = router; 