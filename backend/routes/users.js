const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Toutes les routes sont protégées par l'authentification et le rôle admin
router.use(protect, admin);

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 