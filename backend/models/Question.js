const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['YesNo', 'MultiChoice', 'Text'],
    required: true
  },
  options: {
    type: String
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  },
  targetGroup: {
    type: String,
    enum: ['child', 'adult', 'disability', 'all'],
    required: true
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 