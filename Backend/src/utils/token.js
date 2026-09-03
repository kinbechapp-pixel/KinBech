const jwt = require('jsonwebtoken');

function signUserToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    rating: user.rating,
    soldCount: user.soldCount,
    boughtCount: user.boughtCount,
  };
}

module.exports = { signUserToken, publicUser };
