const { Router } = require('express');
const { 
  createShop, 
  getMyShop, 
  getShopById, 
  updateShop, 
  getShopListings, 
  getShopReviews,
  getAllShops 
} = require('../controllers/shopController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Protected routes
router.post('/', requireAuth, createShop);
router.get('/mine', requireAuth, getMyShop);
router.put('/:shopId', requireAuth, updateShop);

// Public routes
router.get('/', getAllShops);
router.get('/:shopId', getShopById);
router.get('/:shopId/listings', getShopListings);
router.get('/:shopId/reviews', getShopReviews);

module.exports = router;