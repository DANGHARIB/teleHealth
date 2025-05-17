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
  getRandomQuestions
} = require('../controllers/questionController');
const { protect, admin, patient } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getQuestions);

// Route to get random questions for patients (first-time login)
// IMPORTANT: This specific route needs to be placed BEFORE the /:id route
router.get('/random/assessment', protect, patient, getRandomQuestions);

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