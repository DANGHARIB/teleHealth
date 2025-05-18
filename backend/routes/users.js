const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  registerDeviceToken
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Route pour enregistrer le token d'appareil (accessible à tous les utilisateurs authentifiés)
router.post('/device-token', protect, registerDeviceToken);

// Toutes les routes suivantes sont protégées par l'authentification et le rôle admin
router.use(protect, admin);

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 