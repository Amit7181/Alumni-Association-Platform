const express = require('express');
const router = express.Router();
const { registerUser, loginUser, sendEmailOTP, verifyEmailOTP, sendPhoneOTP, verifyPhoneOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/send-otp-phone', sendPhoneOTP);
router.post('/verify-otp-phone', verifyPhoneOTP);

module.exports = router;
