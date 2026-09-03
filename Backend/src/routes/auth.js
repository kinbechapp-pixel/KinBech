const { Router } = require('express');
const { signup, login, verifyOtp, me, updateMe, completeSignup, updatePreferences } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/otp', verifyOtp);
router.post('/complete-signup', completeSignup);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.patch('/preferences', requireAuth, updatePreferences);

module.exports = router;
