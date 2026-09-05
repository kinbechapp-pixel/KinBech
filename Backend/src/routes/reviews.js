const { Router } = require('express');
const { createReview, getShopReviews, getUserReviews, getMyReviews } = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/', requireAuth, createReview);
router.get('/my', requireAuth, getMyReviews);
router.get('/shop/:shopId', getShopReviews);
router.get('/user/:userId', getUserReviews);

module.exports = router;