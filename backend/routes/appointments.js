const express = require('express');
const router = express.Router();
const { 
  createAppointment, 
  getAppointments, 
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment
} = require('../controllers/appointmentController');
const { protect, admin, doctor, patient } = require('../middlewares/authMiddleware');

// Routes protégées pour les admins
router.get('/', protect, admin, getAppointments);

// Routes protégées pour tous les utilisateurs authentifiés
router.get('/:id', protect, getAppointmentById);
router.delete('/:id', protect, cancelAppointment);

// Routes protégées pour les patients
router.post('/', protect, patient, createAppointment);
router.get('/patient/me', protect, patient, getPatientAppointments);

// Routes protégées pour les médecins
router.get('/doctor/me', protect, doctor, getDoctorAppointments);
router.put('/:id/status', protect, doctor, updateAppointmentStatus);

// Route d'annulation pour les patients
router.put('/:id/cancel', protect, patient, cancelAppointment);

module.exports = router; 