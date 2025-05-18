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
    enum: ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled', 'rescheduled', 'reschedule_requested'],
    default: 'pending' // Changé de 'confirmed' à 'pending'
  },
  sessionLink: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'cancelled'],
    default: 'pending' // Changé de 'completed' à 'pending'
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

// Explicitly define a NON-unique index on availability
appointmentSchema.index({ availability: 1 }, { unique: false });

// Create a compound index for doctor + patient + date to ensure one appointment per day per patient per doctor
appointmentSchema.index({ doctor: 1, patient: 1, "availability": 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 