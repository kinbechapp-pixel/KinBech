const { Router } = require('express');
const {
  getListings,
  searchListings,
  getMyListings,
  getListing,
  incrementView,
  createListing,
  updateListing,
  deleteListing,
  getAllListingsAdmin,
  updateListingStatusAdmin,
} = require('../controllers/listingController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// Public routes
router.get('/', getListings);
router.get('/search', searchListings);
router.get('/:id', getListing);
router.post('/:id/view', incrementView);

// Protected routes
router.get('/mine', requireAuth, getMyListings);
router.post('/', requireAuth, createListing);
router.put('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);

// Admin routes
router.get('/admin/all', requireAdmin, getAllListingsAdmin);
router.patch('/admin/:listingId/status', requireAdmin, updateListingStatusAdmin);

module.exports = router;
