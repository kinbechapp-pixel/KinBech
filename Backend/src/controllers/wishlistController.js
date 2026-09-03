const Wishlist = require('../models/Wishlist');
const { listingPayload } = require('../utils/listing');

async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'listings',
      populate: { path: 'seller', select: 'name phone avatarUrl rating soldCount boughtCount' },
    });

    const listings = (wishlist?.listings || [])
      .filter(Boolean)
      .map(listingPayload);

    res.json({ listings });
  } catch (error) {
    next(error);
  }
}

async function toggleWishlist(req, res, next) {
  try {
    const listingId = req.body.listingId || req.params.listingId;
    if (!listingId) {
      return res.status(400).json({ message: 'listingId is required' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, listings: [listingId] });
      return res.json({ saved: true, listings: wishlist.listings });
    }

    const exists = wishlist.listings.some((id) => String(id) === String(listingId));
    if (exists) {
      wishlist.listings = wishlist.listings.filter((id) => String(id) !== String(listingId));
    } else {
      wishlist.listings.push(listingId);
    }

    await wishlist.save();
    res.json({ saved: !exists, listings: wishlist.listings });
  } catch (error) {
    next(error);
  }
}

module.exports = { getWishlist, toggleWishlist };
