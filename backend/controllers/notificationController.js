const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * Contrôleur de notifications
 * Ce contrôleur gère toutes les opérations liées aux notifications
 */

// @desc    Récupérer les notifications de l'utilisateur connecté
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filtrer par read status si spécifié
    const query = { recipient: req.user._id };
    if (req.query.read === 'true') {
      query.read = true;
    } else if (req.query.read === 'false') {
      query.read = false;
    }
    
    // Récupérer les notifications de l'utilisateur avec pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Obtenir le nombre total de notifications pour la pagination
    const totalNotifications = await Notification.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      total: totalNotifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      data: notifications
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications'
    });
  }
};

// @desc    Récupérer le nombre de notifications non lues de l'utilisateur
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
    console.error('Erreur lors du comptage des notifications non lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du comptage des notifications non lues'
    });
  }
};

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    // Vérifier que l'utilisateur est bien le destinataire
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette notification'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du marquage de la notification'
    });
  }
};

// @desc    Marquer toutes les notifications comme lues
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
      message: `${result.nModified} notifications marquées comme lues`
    });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du marquage des notifications'
    });
  }
};

// @desc    Supprimer une notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    // Vérifier que l'utilisateur est bien le destinataire
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cette notification'
      });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la notification'
    });
  }
};

// @desc    Supprimer toutes les notifications de l'utilisateur
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });
    
    res.status(200).json({
      success: true,
      count: result.deletedCount,
      message: `${result.deletedCount} notifications supprimées`
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression des notifications'
    });
  }
};

// @desc    Créer une notification (pour test et usage interne uniquement)
// @route   POST /api/notifications/test
// @access  Private/Admin
exports.createTestNotification = async (req, res) => {
  try {
    const { userId, title, message, type, data } = req.body;
    
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un titre, un message et un type'
      });
    }
    
    // Si un ID utilisateur est fourni, l'utiliser, sinon utiliser l'ID de l'utilisateur authentifié
    const recipientId = userId || req.user._id;
    
    // Créer la notification en base de données
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      data: data || {},
      read: false
    });
    
    // Envoyer la notification push via le service de notification
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
        
        // Marquer comme envoyée
        notification.pushed = true;
        await notification.save();
      }
    } catch (pushError) {
      console.error('Erreur lors de l\'envoi de la notification push:', pushError);
      // Ne pas échouer la requête si l'envoi push échoue
    }
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la notification'
    });
  }
}; 