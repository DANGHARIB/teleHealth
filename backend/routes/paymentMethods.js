const express = require('express');
const router = express.Router();
const { protect, patient } = require('../middlewares/authMiddleware');
const {
  addPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod
} = require('../controllers/paymentMethodController');

// Routes pour les méthodes de paiement
router.route('/')
  .post(protect, patient, addPaymentMethod)
  .get(protect, patient, getPaymentMethods);

router.route('/:id/default')
  .put(protect, patient, setDefaultPaymentMethod);

router.route('/:id')
  .delete(protect, patient, deletePaymentMethod);

module.exports = router; 