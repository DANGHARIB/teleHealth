const mongoose = require('mongoose');

/**
 * Schéma de notification
 * Ce modèle représente une notification envoyée à un utilisateur
 */
const notificationSchema = new mongoose.Schema({
  // L'utilisateur destinataire de la notification
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Titre de la notification
  title: { 
    type: String, 
    required: true 
  },
  
  // Message détaillé de la notification
  message: { 
    type: String, 
    required: true 
  },
  
  // Type de notification (pour déterminer les actions et l'affichage)
  type: { 
    type: String, 
    required: true,
    enum: [
      'new_appointment',       // Nouveau rendez-vous créé
      'confirmed_appointment', // Rendez-vous confirmé
      'reschedule_requested',  // Demande de reprogrammation
      'rescheduled',           // Rendez-vous reprogrammé
      'cancelled_appointment', // Rendez-vous annulé
      'payment_received',      // Paiement reçu
      'payment_refunded',      // Remboursement effectué
      'appointment_reminder',  // Rappel de rendez-vous
      'penalty_retained',      // Pénalité d'annulation conservée
      'system'                 // Notification système
    ]
  },
  
  // État de lecture (true si la notification a été lue)
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  // Données supplémentaires pour la notification (dépend du type)
  data: { 
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  },
  
  // Définit si la notification a été envoyée par push
  pushed: {
    type: Boolean,
    default: false
  },
  
  // Définit si la notification doit être prioritaire
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  
  // Date d'expiration de la notification (null = pas d'expiration)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  // Ajouter automatiquement createdAt et updatedAt
  timestamps: true
});

// Ajouter un index TTL pour supprimer automatiquement les notifications expirées
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: "date" } } });

// Index composé pour optimiser les requêtes des notifications non lues par utilisateur
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 