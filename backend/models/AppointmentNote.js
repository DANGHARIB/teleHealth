const mongoose = require('mongoose');

/**
 * Schéma des notes de rendez-vous
 * Ce modèle représente les notes prises par un médecin après un rendez-vous avec un patient
 */
const appointmentNoteSchema = new mongoose.Schema({
  // Le rendez-vous auquel cette note est associée
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true
  },
  
  // Le médecin qui a créé la note
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  
  // Le patient concerné par la note
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  
  // Contenu de la note
  content: {
    type: String,
    required: true
  },
  
  // Diagnostic établi (optionnel)
  diagnosis: {
    type: String,
    default: ''
  },
  
  // Traitement prescrit (optionnel)
  treatment: {
    type: String,
    default: ''
  },
  
  // Conseils au patient (optionnel)
  advice: {
    type: String,
    default: ''
  },
  
  // Suivi recommandé (optionnel)
  followUp: {
    type: String,
    default: ''
  }
}, {
  // Ajouter automatiquement createdAt et updatedAt
  timestamps: true
});

// Créer un index composé pour faciliter la recherche des notes par médecin et patient
appointmentNoteSchema.index({ doctor: 1, patient: 1 });

const AppointmentNote = mongoose.model('AppointmentNote', appointmentNoteSchema);

module.exports = AppointmentNote; 