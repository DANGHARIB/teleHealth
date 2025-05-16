const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  getPatientById, 
  updatePatientProfile,
  markAssessment,
  getPatientProfile
} = require('../controllers/patientController');
const { protect, admin, patient } = require('../middlewares/authMiddleware');

// Routes protégées pour les admins
router.get('/', protect, admin, getPatients);

// Route pour le patient connecté pour récupérer son profil complet
router.get('/profile', protect, patient, getPatientProfile);

// Routes protégées pour les patients ou admins
router.get('/:id', protect, getPatientById);

// Routes protégées pour les patients
router.put('/profile', protect, patient, updatePatientProfile);
router.put('/mark-assessment', protect, patient, markAssessment);

module.exports = router; 