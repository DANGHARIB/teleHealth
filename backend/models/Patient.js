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
  },
  assessment_results: {
    specializations: [{
      specializationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialization'
      },
      score: {
        type: Number,
        default: 0
      }
    }],
    completed_at: {
      type: Date
    }
  },
  recommended_doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  savedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }]
}, {
  timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient; 