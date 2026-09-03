const Review = require('../models/Review');
const User = require('../models/User');
const Listing = require('../models/Listing');

async function createReview(req, res, next) {
  try {
    const { reviewedUserId, listingId, rating, review, tags } = req.body;

    if (!reviewedUserId || !listingId || !rating) {
      return res.status(400).json({ message: 'Reviewed user ID, listing ID, and rating are required' });
    }

    if (String(reviewedUserId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    const reviewedUser = await User.findById(reviewedUserId);
    if (!reviewedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if already reviewed
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
      reviewedUser: reviewedUserId,
      listing: listingId,
      rating: Number(rating),
      review: review || '',
      tags: tags || [],
    });

    // Update seller's average rating
    const allReviews = await Review.find({ reviewedUser, status: 'approved' });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0) + rating;
    const avgRating = (totalRating / (allReviews.length + 1)).toFixed(1);

    await User.findByIdAndUpdate(reviewedUserId, {
      rating: Number(avgRating),
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

async function getUserReviews(req, res, next) {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewedUser: userId, status: 'approved' })
      .populate('reviewer', 'name avatarUrl')
      .populate('listing', 'title photos')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('reviewedUser', 'name avatarUrl')
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
  getUserReviews,
  getMyReviews,
};