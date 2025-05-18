const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['card', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    // Pour les cartes bancaires
    cardholderName: {
      type: String,
      trim: true
    },
    // Nous stockons uniquement les 4 derniers chiffres pour des raisons de sécurité
    lastFourDigits: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 4
    },
    // Mois d'expiration (format MM)
    expiryMonth: {
      type: String,
      minlength: 1,
      maxlength: 2
    },
    // Année d'expiration (format YY)
    expiryYear: {
      type: String,
      minlength: 2,
      maxlength: 2
    },
    // Type de carte (Visa, Mastercard, etc.)
    cardType: {
      type: String,
      trim: true
    },
    // Indique si c'est la méthode de paiement par défaut
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index pour rechercher rapidement les méthodes de paiement d'un patient
paymentMethodSchema.index({ patient: 1, createdAt: -1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod; 