const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  date_of_birth: {
    type: Date
  },
  has_taken_assessment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient; 