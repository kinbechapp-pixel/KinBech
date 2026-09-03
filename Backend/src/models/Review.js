const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxLength: 500 },
    tags: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true, collection: 'reviews' }
);

// Ensure one review per user per listing
reviewSchema.index({ reviewer: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);