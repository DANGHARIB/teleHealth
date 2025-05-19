const express = require('express');
const router = express.Router();
const { 
  createAppointmentNote,
  updateAppointmentNote,
  getDoctorNotes,
  getPatientNotes,
  getNoteById,
  deleteNote,
  checkNoteExists
} = require('../controllers/appointmentNoteController');
const { protect, doctor } = require('../middlewares/authMiddleware');

// Routes protégées pour les médecins uniquement
router.post('/', protect, doctor, createAppointmentNote);
router.put('/:id', protect, doctor, updateAppointmentNote);
router.get('/', protect, doctor, getDoctorNotes);
router.get('/patient/:patientId', protect, doctor, getPatientNotes);
router.get('/check/:appointmentId', protect, doctor, checkNoteExists);
router.get('/:id', protect, doctor, getNoteById);
router.delete('/:id', protect, doctor, deleteNote);

module.exports = router; 