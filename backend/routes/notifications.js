const express = require('express');
const router = express.Router();
const { 
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createTestNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Protected routes for all authenticated users
router.get('/', protect, getUserNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/clear-all', protect, clearAllNotifications);
router.delete('/:id', protect, deleteNotification);

// Protected routes for admins only
router.post('/test', protect, admin, createTestNotification);

module.exports = router; 