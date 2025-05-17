const mongoose = require('mongoose');

const patientResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  response: {
    type: String,
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a debug hook to log when a new PatientResponse is being created
patientResponseSchema.pre('save', function(next) {
  console.log(`Saving PatientResponse - User: ${this.user}, Question: ${this.question}, Response: ${this.response}`);
  next();
});

const PatientResponse = mongoose.model('PatientResponse', patientResponseSchema);

module.exports = PatientResponse; 