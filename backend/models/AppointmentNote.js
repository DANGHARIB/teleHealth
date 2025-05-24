const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Appointment Notes Schema
 * This model represents notes taken by a doctor after an appointment with a patient
 * Sensitive data is encrypted to comply with HIPAA standards
 */

// Function wrapper for encrypt that handles null/undefined values
const encryptField = function(val) {
  if (val === null || val === undefined) return '';
  return encrypt(val);
};

// Function wrapper for decrypt that handles null/undefined values
const decryptField = function(val) {
  if (val === null || val === undefined) return '';
  return decrypt(val);
};

const appointmentNoteSchema = new mongoose.Schema({
  // The appointment this note is associated with
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true
  },
  
  // The doctor who created the note
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  
  // The patient concerned by the note
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  
  // Content of the note (encrypted)
  content: {
    type: String,
    required: true,
    set: encryptField,
    get: decryptField
  },
  
  // Diagnosis (optional, encrypted)
  diagnosis: {
    type: String,
    default: '',
    set: encryptField,
    get: decryptField
  },
  
  // Prescribed treatment (optional, encrypted)
  treatment: {
    type: String,
    default: '',
    set: encryptField,
    get: decryptField
  },
  
  // Advice to patient (optional, encrypted)
  advice: {
    type: String,
    default: '',
    set: encryptField,
    get: decryptField
  },
  
  // Recommended follow-up (optional, encrypted)
  followUp: {
    type: String,
    default: '',
    set: encryptField,
    get: decryptField
  }
}, {
  // Automatically add createdAt and updatedAt
  timestamps: true,
  // Ensure getters are applied when converting to JSON/object
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Create a composite index to facilitate searching notes by doctor and patient
appointmentNoteSchema.index({ doctor: 1, patient: 1 });

const AppointmentNote = mongoose.model('AppointmentNote', appointmentNoteSchema);

module.exports = AppointmentNote; 