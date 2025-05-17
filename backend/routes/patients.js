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
  getSavedDoctors
} = require('../controllers/patientController');
const { protect, admin, patient } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Routes protégées pour les patients
router.route('/profile')
  .get(protect, patient, getPatientProfile)
  .put(protect, patient, updatePatientProfile);

// Routes pour les médecins sauvegardés
router.route('/save-doctor/:doctorId')
  .post(protect, patient, saveDoctor)
  .delete(protect, patient, removeSavedDoctor);

router.get('/saved-doctors', protect, patient, getSavedDoctors);

// Routes admin
router.get('/', protect, admin, getPatients);
router.get('/:id', protect, admin, getPatientById);
router.delete('/:id', protect, admin, deletePatient);

module.exports = router; 