const { Router } = require('express');
const { createReview, getShopReviews, getUserReviews, getMyReviews, getAllReviews, updateReviewStatus } = require('../controllers/reviewController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// User routes
router.post('/', requireAuth, createReview);
router.get('/my', requireAuth, getMyReviews);
router.get('/shop/:shopId', getShopReviews);
router.get('/user/:userId', getUserReviews);

// Admin routes
router.get('/admin/all', requireAdmin, getAllReviews);
router.patch('/admin/:reviewId/status', requireAdmin, updateReviewStatus);

module.exports = router;