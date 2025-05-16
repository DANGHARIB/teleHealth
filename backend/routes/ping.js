const express = require('express');
const router = express.Router();

// Route de test
router.get('/', (req, res) => {
  res.json({ message: 'API opérationnelle!' });
});

module.exports = router; 