const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUserProfile, 
  verifyOTP,
  resendOTP
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Routes protégées
router.get('/profile', protect, getUserProfile);

module.exports = router; 