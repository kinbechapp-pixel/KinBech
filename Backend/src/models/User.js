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
    rating: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    boughtCount: { type: Number, default: 0 },
    blockedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
