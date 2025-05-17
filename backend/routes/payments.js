const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPatientPayments,
  getDoctorPayments,
  getPaymentById,
  refundPayment
} = require('../controllers/paymentController');
const { protect, admin, patient, doctor } = require('../middlewares/authMiddleware');

// Routes protégées pour les patients
router.post('/', protect, patient, createPayment);
router.get('/patient', protect, patient, getPatientPayments);

// Routes protégées pour les médecins
router.get('/doctor', protect, doctor, getDoctorPayments);

// Route protégée pour obtenir un paiement par ID
router.get('/:id', protect, getPaymentById);

// Route protégée pour les administrateurs (remboursements)
router.post('/:id/refund', protect, admin, refundPayment);

module.exports = router; 