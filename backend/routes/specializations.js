const express = require('express');
const router = express.Router();
const { 
  getSpecializations, 
  getSpecializationById, 
  createSpecialization,
  updateSpecialization,
  deleteSpecialization
} = require('../controllers/specializationController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Routes publiques
router.get('/', getSpecializations);
router.get('/:id', getSpecializationById);

// Routes protégées pour les admins
router.post('/', protect, admin, createSpecialization);
router.put('/:id', protect, admin, updateSpecialization);
router.delete('/:id', protect, admin, deleteSpecialization);

module.exports = router; 