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
    required: true,
    unique: true
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
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  sessionLink: {
    type: String
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