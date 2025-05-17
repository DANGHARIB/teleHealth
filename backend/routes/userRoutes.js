const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes accessibles sans authentification
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Routes nécessitant une authentification
router.use(authMiddleware);
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.post('/device-token', userController.registerDeviceToken);

module.exports = router; 