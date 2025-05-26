const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPatientPayments,
  getDoctorPayments,
  getPaymentById,
  refundPayment,
  createAppointmentWithPayment,
  getAllPayments
} = require('../controllers/paymentController');
const { protect, admin, patient, doctor } = require('../middlewares/authMiddleware');

// Routes protégées pour les patients
router.post('/', protect, patient, createPayment);
router.post('/appointment-with-payment', protect, patient, createAppointmentWithPayment);
router.get('/patient', protect, patient, getPatientPayments);

// Routes protégées pour les médecins
router.get('/doctor', protect, doctor, getDoctorPayments);

// Routes protégées pour les administrateurs
router.get('/', protect, admin, getAllPayments);

// Routes protégées communes
router.get('/:id', protect, getPaymentById);
router.post('/:id/refund', protect, admin, refundPayment);

module.exports = router; 