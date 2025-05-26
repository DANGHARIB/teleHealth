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
    type: mongoose.Schema.Types.Mixed,
    required: function() {
      return this.type === 'MultiChoice';
    }
  },
  scoring: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  id: {
    type: Number,
    required: true
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialization'
  },
  targetGroup: {
    type: String,
    enum: ['child', 'adult', 'disability', 'all'],
    default: 'all'
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 