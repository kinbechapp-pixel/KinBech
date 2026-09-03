const { Router } = require('express');
const { createReport, blockUser, unblockUser, getMyReports } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/', requireAuth, createReport);
router.get('/my', requireAuth, getMyReports);
router.post('/users/:userId/block', requireAuth, blockUser);
router.delete('/users/:userId/block', requireAuth, unblockUser);

module.exports = router;