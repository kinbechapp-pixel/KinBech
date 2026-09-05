const Review = require('../models/Review');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Shop = require('../models/Shop');

async function createReview(req, res, next) {
  try {
    const { shopId, listingId, rating, review, tags } = req.body;

    if (!shopId || !listingId || !rating) {
      return res.status(400).json({ message: 'Shop ID, listing ID, and rating are required' });
    }

    // Verify shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Verify listing exists and belongs to the shop
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Critical business rule: Only shop listings can be reviewed
    if (listing.sellerType !== 'shop' || String(listing.shopId) !== String(shopId)) {
      return res.status(400).json({ message: 'Reviews are only allowed for shop listings' });
    }

    // Prevent shop owner from reviewing their own shop
    if (String(shop.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot review your own shop' });
    }

    // Check if already reviewed this listing
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      listing: listingId,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this listing' });
    }

    // Create review
    const newReview = await Review.create({
      reviewer: req.user._id,
      shopId: shopId,
      listing: listingId,
      rating: Number(rating),
      review: review || '',
      tags: tags || [],
    });

    // Update shop's average rating
    const allReviews = await Review.find({ shopId, status: 'approved' });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
    const avgRating = (totalRating / (allReviews.length + 1)).toFixed(1);

    await Shop.findByIdAndUpdate(shopId, {
      ratingAverage: Number(avgRating),
      reviewCount: allReviews.length + 1,
    });

    res.status(201).json({ 
      message: 'Review submitted successfully',
      review: {
        id: newReview._id,
        rating: newReview.rating,
        review: newReview.review,
        tags: newReview.tags,
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getShopReviews(req, res, next) {
  try {
    const { shopId } = req.params;
    const reviews = await Review.find({ shopId, status: 'approved' })
      .populate('reviewer', 'name avatarUrl')
      .populate('listing', 'title photos')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}

async function getUserReviews(req, res, next) {
  try {
    const { userId } = req.params;
    // This endpoint is deprecated for individual users - now only works for shops
    // For backward compatibility, return empty array
    console.log('getUserReviews called - this endpoint is deprecated for individual users');
    res.json({ reviews: [] });
  } catch (error) {
    next(error);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('shopId', 'name logo')
      .populate('listing', 'title photos')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getShopReviews,
  getUserReviews,
  getMyReviews,
};