const express = require('express');
const router = express.Router();
const { 
  getDoctors, 
  getDoctorById, 
  getDoctorProfile,
  updateDoctorProfile, 
  verifyDoctor,
  uploadProfileImage,
  uploadCertificate,
  deleteDoctor,
  getDoctorAppointments
} = require('../controllers/doctorController');
const { protect, admin, doctor } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Routes publiques
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Routes protégées pour les médecins
router.route('/profile')
  .get(protect, doctor, getDoctorProfile)
  .put(protect, doctor, updateDoctorProfile);

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

// Routes protégées pour les admins
router.put('/:id/verify', protect, admin, verifyDoctor);

// Exemple d'autres routes spécifiques au docteur qui pourraient exister
// router.get('/appointments/me', protect, doctor, getDoctorAppointments);

// Routes Admin (si la suppression est réservée aux admins)
// router.delete('/:id', protect, admin, deleteDoctor); // Exemple si admin peut supprimer

module.exports = router; 