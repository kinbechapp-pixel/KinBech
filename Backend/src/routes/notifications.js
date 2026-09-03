const { Router } = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, getNotifications);
router.patch('/:id/read', requireAuth, markAsRead);
router.patch('/read-all', requireAuth, markAllAsRead);

module.exports = router;