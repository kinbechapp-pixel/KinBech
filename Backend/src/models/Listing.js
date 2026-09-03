const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NPR' },
    category: { type: String, required: true, index: true },
    condition: { type: String, enum: ['New', 'Good', 'Fair'], default: 'Good' },
    photos: [{ type: String }],
    location: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    meetupOption: {
      type: String,
      enum: ['Public place', 'Seller location', 'Buyer location'],
      default: 'Public place',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'sold'],
      default: 'active',
      index: true,
    },
    views: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', location: 'text' });
listingSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('Listing', listingSchema);
