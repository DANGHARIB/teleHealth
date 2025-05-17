const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  availability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability',
    required: true
  },
  slotStartTime: {
    type: String,
    required: true
  },
  slotEndTime: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    comment: 'Durée en minutes'
  },
  status: {
    type: String,
    enum: ['confirmed', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'confirmed' // Par défaut tous les rendez-vous sont confirmés
  },
  sessionLink: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['completed', 'refunded'],
    default: 'completed' // Tous les rendez-vous sont payés par défaut
  },
  caseDetails: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour rechercher rapidement les rendez-vous par médecin ou patient
appointmentSchema.index({ doctor: 1, createdAt: -1 });
appointmentSchema.index({ patient: 1, createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 