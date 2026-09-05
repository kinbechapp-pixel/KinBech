const jwt = require('jsonwebtoken');

function signUserToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  const defaultPrefs = { notifications: true, language: 'English', currency: 'NPR (₨)' };
  const prefs = user.preferences
    ? { ...defaultPrefs, ...(user.preferences.toObject ? user.preferences.toObject() : user.preferences) }
    : defaultPrefs;
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    soldCount: user.soldCount,
    boughtCount: user.boughtCount,
    preferences: prefs,
    location: user.location || '',
    coordinates: user.coordinates || null,
    blockedCount: Array.isArray(user.blockedUserIds) ? user.blockedUserIds.length : 0,
    createdAt: user.createdAt || null,
  };
}

module.exports = { signUserToken, publicUser };
