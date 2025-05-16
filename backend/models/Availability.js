const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour rechercher rapidement les disponibilités par médecin et date
availabilitySchema.index({ doctor: 1, date: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability; 