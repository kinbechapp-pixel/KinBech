const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, unique: true, index: true },
    avatarUrl: { type: String, default: '' },
    location: { type: String, trim: true, default: '' },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    profileComplete: { type: Boolean, default: false },
    soldCount: { type: Number, default: 0 },
    boughtCount: { type: Number, default: 0 },
    blockedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sellerTypePreference: { 
      type: String, 
      enum: ['individual', 'shop', 'both'], 
      default: 'individual' 
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      language: { type: String, default: 'English' },
      currency: { type: String, default: 'NPR (₨)' },
    },
  },
  { timestamps: true, collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
