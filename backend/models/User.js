const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Nom complet est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Mot de passe est requis'],
    minlength: 6
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  profileStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['Patient', 'Doctor', 'Admin'],
    required: true
  },
  otp_code: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  deviceToken: {
    type: String,
    default: null
  },
  hasCompletedAssessment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 