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
} = require('../controllers/listingController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', getListings);
router.get('/search', searchListings);
router.get('/mine', requireAuth, getMyListings);
router.get('/:id', getListing);
router.post('/:id/view', incrementView);
router.post('/', requireAuth, createListing);
router.put('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);

module.exports = router;
