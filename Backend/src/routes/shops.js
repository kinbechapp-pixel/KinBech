const { Router } = require('express');
const { 
  createShop, 
  getMyShop, 
  getShopById, 
  updateShop, 
  getShopListings, 
  getShopReviews,
  getAllShops,
  updateShopStatus,
  getAllShopsAdmin
} = require('../controllers/shopController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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

// Admin routes
router.get('/admin/all', requireAdmin, getAllShopsAdmin);
router.patch('/admin/:shopId/status', requireAdmin, updateShopStatus);

module.exports = router;