const express = require('express');
const router = express.Router();
const { 
  createAvailability, 
  getDoctorAvailability, 
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
  createBatchAvailability
} = require('../controllers/availabilityController');
const { protect, doctor } = require('../middlewares/authMiddleware');

// Routes publiques
router.get('/doctor/:id', getDoctorAvailability);

// Routes protégées pour les médecins
router.post('/', protect, doctor, createAvailability);
router.post('/batch', protect, doctor, createBatchAvailability);
router.get('/my-availability', protect, doctor, getMyAvailability);
router.put('/:id', protect, doctor, updateAvailability);
router.delete('/:id', protect, doctor, deleteAvailability);

module.exports = router; 