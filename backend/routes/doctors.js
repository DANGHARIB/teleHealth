const express = require('express');
const router = express.Router();
const { 
  getDoctors, 
  getDoctorById, 
  getDoctorProfile,
  updateDoctorProfile, 
  verifyDoctor,
  rejectDoctor,
  getVerificationStatus,
  uploadProfileImage,
  uploadCertificate,
  deleteDoctor,
  getDoctorAppointments,
  getSavedPatients,
  searchSavedPatients,
  searchDoctors,
  getDoctorPatientCount
} = require('../controllers/doctorController');
const { protect, admin, doctor } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Routes publiques
router.get('/', getDoctors);
router.get('/search', searchDoctors);

// Routes protégées pour les médecins
router.route('/profile')
  .get(protect, doctor, getDoctorProfile)
  .put(protect, doctor, upload.array('certificationFiles', 5), updateDoctorProfile);

// Route pour vérifier son propre statut de vérification (accessible par le médecin)
router.get('/verification-status', protect, doctor, getVerificationStatus);

// Routes pour les patients qui ont sauvegardé le médecin
router.get('/saved-patients', protect, doctor, getSavedPatients);
router.get('/search-patients', protect, doctor, searchSavedPatients);

router.get('/:id', getDoctorById);
router.get('/:id/patients/count', protect, getDoctorPatientCount);

// Route pour vérifier le statut d'un médecin spécifique (accessible par admin)
router.get('/:id/verification-status', protect, admin, getVerificationStatus);

router.put(
  '/upload-image', 
  protect, 
  doctor, 
  upload.single('image'), 
  uploadProfileImage
);
router.put(
  '/upload-certificate', 
  protect, 
  doctor, 
  upload.single('certificate'), 
  uploadCertificate
);

// Routes protégées pour les admins - vérification/rejet des médecins
router.patch('/:id/verify', protect, admin, verifyDoctor);
router.patch('/:id/reject', protect, admin, rejectDoctor);

// Exemple d'autres routes spécifiques au docteur qui pourraient exister
// router.get('/appointments/me', protect, doctor, getDoctorAppointments);

// Routes Admin (si la suppression est réservée aux admins)
// router.delete('/:id', protect, admin, deleteDoctor); // Exemple si admin peut supprimer

// Route publique pour vérifier le statut de vérification d'un médecin par userId
router.get('/public/verification/:userId', getVerificationStatus);

module.exports = router; 