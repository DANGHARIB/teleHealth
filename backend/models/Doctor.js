const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const doctorSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  full_name: {
    type: String,
    // required: true // full_name will be taken from User model during registration, can be updated later
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization',
  },
  doctor_image: {
    type: String
  },
  about: {
    type: String
  },
  education: {
    type: String
  },
  experience: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  dob: {
    type: Date
  },
  certifications: { // Changed to array of strings for file paths
    type: [String],
    default: []
  },
  specializations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 