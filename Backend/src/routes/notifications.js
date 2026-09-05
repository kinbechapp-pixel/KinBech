const { Router } = require('express');
const { getNotifications, markAsRead, markAllAsRead, createBroadcastNotification, getBroadcastNotifications } = require('../controllers/notificationController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// User routes
router.get('/', requireAuth, getNotifications);
router.patch('/:id/read', requireAuth, markAsRead);
router.patch('/read-all', requireAuth, markAllAsRead);

// Admin routes
router.post('/admin/broadcast', requireAdmin, createBroadcastNotification);
router.get('/admin/broadcasts', requireAdmin, getBroadcastNotifications);

module.exports = router;