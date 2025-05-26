const express = require('express');
const router = express.Router();
const { 
  getQuestions, 
  getQuestionById, 
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitResponses,
  getUserResponses,
  getAssessmentQuestions
} = require('../controllers/questionController');
const { protect, admin, patient } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getQuestions);

// Route pour obtenir les questions d'évaluation pour les patients
// IMPORTANT: Cette route spécifique doit être placée AVANT la route /:id
router.get('/assessment', protect, patient, getAssessmentQuestions);

// Other public routes
router.get('/:id', getQuestionById);

// Protected routes for patients
router.post('/submit-responses', protect, patient, submitResponses);
router.get('/user-responses', protect, getUserResponses);

// Admin routes
router.post('/', protect, admin, createQuestion);
router.put('/:id', protect, admin, updateQuestion);
router.delete('/:id', protect, admin, deleteQuestion);

module.exports = router; 