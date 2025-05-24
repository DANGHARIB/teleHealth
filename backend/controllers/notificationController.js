const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * This controller handles all operations related to notifications
 */

// @desc    Get notifications for the logged in user
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    console.log('Retrieving notifications for', req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filter by read status if specified
    const query = { recipient: req.user._id };
    if (req.query.read === 'true') {
      query.read = true;
    } else if (req.query.read === 'false') {
      query.read = false;
    }
    
    // Get user notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total notifications count for pagination
    const totalNotifications = await Notification.countDocuments(query);
    
    // Get unread notifications count
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id,
      read: false
    });
    
    console.log(`${notifications.length} notifications retrieved, ${unreadCount} unread`);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      total: totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving notifications'
    });
  }
};

// @desc    Get unread notification count for the user
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while counting unread notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Verify that the user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this notification'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      count: result.nModified,
      message: `${result.nModified} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notifications'
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Verify that the user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
};

// @desc    Delete all user notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });
    
    res.status(200).json({
      success: true,
      count: result.deletedCount,
      message: `${result.deletedCount} notifications deleted`
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notifications'
    });
  }
};

// @desc    Create a notification (for testing and internal use only)
// @route   POST /api/notifications/test
// @access  Private/Admin
exports.createTestNotification = async (req, res) => {
  try {
    const { userId, title, message, type, data } = req.body;
    
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title, message and type'
      });
    }
    
    // If a user ID is provided, use it, otherwise use the authenticated user's ID
    const recipientId = userId || req.user._id;
    
    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      data: data || {},
      read: false
    });
    
    // Send push notification via notification service
    try {
      const recipient = await User.findById(recipientId);
      if (recipient && recipient.deviceToken) {
        await notificationService.sendNotification(
          recipient._id,
          title,
          message,
          {
            ...data,
            type,
            notificationId: notification._id.toString()
          }
        );
        
        // Mark as sent
        notification.pushed = true;
        await notification.save();
      }
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Don't fail the request if push sending fails
    }
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification'
    });
  }
}; 