const Notification = require('../models/Notification');

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(
      id,
      { unread: false },
      { new: true }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { user: req.user._id, unread: true },
      { unread: false }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function createBroadcastNotification(req, res, next) {
  try {
    const { title, message, audience, deliveryMethod } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // Create a broadcast notification record (for admin tracking)
    const broadcast = await Notification.create({
      type: 'broadcast',
      title,
      body: message, // Store in body field
      message: message, // Also store in message for compatibility
      audience: audience || 'all',
      deliveryMethod: deliveryMethod || 'both',
      sender: req.user._id,
      createdAt: new Date(),
    });

    // In a real implementation, this would trigger push notifications to all users
    // For now, we'll just log it
    console.log('Broadcast notification created:', {
      title,
      audience,
      deliveryMethod,
      broadcastId: broadcast._id,
    });

    res.status(201).json({ 
      message: 'Broadcast notification created successfully',
      broadcast: {
        id: broadcast._id,
        title: broadcast.title,
        message: broadcast.message || broadcast.body,
        audience: broadcast.audience,
        deliveryMethod: broadcast.deliveryMethod,
        createdAt: broadcast.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getBroadcastNotifications(req, res, next) {
  try {
    const broadcasts = await Notification.find({ type: 'broadcast' })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ broadcasts });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createBroadcastNotification,
  getBroadcastNotifications,
};