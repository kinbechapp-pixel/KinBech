const { Router } = require('express');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
router.get('/', getWishlist);
router.post('/', toggleWishlist);
router.post('/:listingId', toggleWishlist);

module.exports = router;
