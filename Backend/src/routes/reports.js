const { Router } = require('express');
const { createReport, blockUser, unblockUser, getMyReports, getAllReports, updateReportStatus } = require('../controllers/reportController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// User routes
router.post('/', requireAuth, createReport);
router.get('/my', requireAuth, getMyReports);
router.post('/users/:userId/block', requireAuth, blockUser);
router.delete('/users/:userId/block', requireAuth, unblockUser);

// Admin routes
router.get('/admin/all', requireAdmin, getAllReports);
router.patch('/admin/:reportId/status', requireAdmin, updateReportStatus);

module.exports = router;