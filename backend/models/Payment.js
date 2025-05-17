const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'apple_pay', 'google_pay'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'failed'],
    default: 'completed'
  },
  transactionId: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour rechercher rapidement les paiements par patient ou rendez-vous
paymentSchema.index({ patient: 1, createdAt: -1 });
paymentSchema.index({ appointment: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 