const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  getPatientById,
  getPatientProfile,
  updatePatientProfile, 
  deletePatient,
  saveDoctor,
  removeSavedDoctor,
  getSavedDoctors,
  getRecommendedDoctors,
  markAssessment
} = require('../controllers/patientController');
const { protect, admin, patient } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Placer les routes spécifiques avant les routes paramétriques
router.get('/profile', protect, patient, getPatientProfile);
router.put('/profile', protect, patient, updatePatientProfile);
router.put('/mark-assessment', protect, patient, markAssessment);
router.get('/saved-doctors', protect, patient, getSavedDoctors);
router.get('/recommended-doctors', protect, patient, getRecommendedDoctors);
router.post('/save-doctor/:doctorId', protect, patient, saveDoctor);
router.delete('/save-doctor/:doctorId', protect, patient, removeSavedDoctor);

// Routes paramétriques (avec :id)
router.get('/:id', protect, admin, getPatientById);
router.delete('/:id', protect, admin, deletePatient);

// Routes admin
router.get('/', protect, admin, getPatients);

module.exports = router; 