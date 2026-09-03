const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['listing', 'chat', 'system', 'promotion'], default: 'system' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: 'notifications-outline' },
    iconBg: { type: String, default: 'iconBackground' },
    unread: { type: Boolean, default: true },
    route: { type: String },
    params: { type: Object },
    tab: { type: String },
    relatedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    relatedChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  },
  { timestamps: true, collection: 'notifications' }
);

module.exports = mongoose.model('Notification', notificationSchema);