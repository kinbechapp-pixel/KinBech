const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const User = require('../models/User');
const { normalizePhone } = require('../utils/phone');
const { signUserToken, publicUser } = require('../utils/token');

function otpExpiry() {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES || 5);
  return new Date(Date.now() + minutes * 60 * 1000);
}

function makeOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function issueOtp(phone, purpose, name = '') {
  const code = makeOtp();
  const hashed = await bcrypt.hash(code, 10);

  await Otp.updateMany({ phone, consumed: false }, { consumed: true });
  await Otp.create({
    phone,
    code: hashed,
    purpose,
    name,
    expiresAt: otpExpiry(),
  });

  return code;
}

async function signup(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Please enter your name to continue' });
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'An account with this number already exists. Please log in instead.' });
    }

    const otp = await issueOtp(phone, 'signup', name);
    const payload = { message: 'Verification code sent successfully', phone };

    if (process.env.NODE_ENV !== 'production') {
      payload.otp = otp;
    }

    return res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
    }

    const user = await User.findOne({ phone });
    
    // Auto-signup: if user doesn't exist, treat as signup without name
    if (!user) {
      const otp = await issueOtp(phone, 'signup', '');
      const payload = { message: 'Verification code sent successfully', phone, isNewUser: true };

      if (process.env.NODE_ENV !== 'production') {
        payload.otp = otp;
      }

      return res.status(201).json(payload);
    }

    const otp = await issueOtp(phone, 'login', user.name);
    const payload = { message: 'Verification code sent successfully', phone, isNewUser: false };

    if (process.env.NODE_ENV !== 'production') {
      payload.otp = otp;
    }

    return res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);
    const code = String(req.body.otp || req.body.code || '').trim();

    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone number and verification code are required' });
    }

    const record = await Otp.findOne({
      phone,
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: 'This verification code has expired. Please request a new one.' });
    }

    const matches = await bcrypt.compare(code, record.code);
    if (!matches) {
      return res.status(400).json({ message: 'The verification code you entered is incorrect. Please try again.' });
    }

    record.consumed = true;
    await record.save();

    let user = await User.findOne({ phone });
    
    // Auto-create user if this was a signup OTP (without name initially)
    if (!user && record.purpose === 'signup') {
      user = await User.create({
        phone,
        name: '',
        profileComplete: false,
      });
    }

    if (!user) {
      return res.json({
        isNewUser: true,
        phone,
      });
    }

    const token = signUserToken(user);
    return res.json({
      token,
      user: publicUser(user),
      isNewUser: false,
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

async function completeSignup(req, res, next) {
  try {
    const phone = normalizePhone(req.body.phone);
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ message: 'Please enter your name to continue' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'An account with this number already exists. Please log in instead.' });
    }

    const user = await User.create({
      phone,
      name,
    });

    const token = signUserToken(user);
    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    if (req.body.name !== undefined) {
      req.user.name = String(req.body.name).trim();
    }
    if (req.body.avatarUrl !== undefined) {
      req.user.avatarUrl = String(req.body.avatarUrl).trim();
    }
    if (req.body.location !== undefined) {
      req.user.location = String(req.body.location).trim();
    }
    if (req.body.coordinates !== undefined) {
      req.user.coordinates = {
        latitude: Number(req.body.coordinates.latitude),
        longitude: Number(req.body.coordinates.longitude),
      };
    }
    if (req.body.profileComplete !== undefined) {
      req.user.profileComplete = Boolean(req.body.profileComplete);
    }

    await req.user.save();
    const token = signUserToken(req.user);
    return res.json({
      token,
      user: publicUser(req.user),
    });
  } catch (error) {
    next(error);
  }
}

async function updatePreferences(req, res, next) {
  try {
    if (req.body.notifications !== undefined) {
      req.user.preferences = req.user.preferences || {};
      req.user.preferences.notifications = Boolean(req.body.notifications);
    }
    if (req.body.language !== undefined) {
      req.user.preferences = req.user.preferences || {};
      req.user.preferences.language = String(req.body.language);
    }
    if (req.body.currency !== undefined) {
      req.user.preferences = req.user.preferences || {};
      req.user.preferences.currency = String(req.body.currency);
    }

    await req.user.save();
    const token = signUserToken(req.user);
    return res.json({
      token,
      user: publicUser(req.user),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { signup, login, verifyOtp, me, updateMe, completeSignup, updatePreferences };
