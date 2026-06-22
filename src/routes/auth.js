const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPStore = require('../models/OTPStore');
const { sendOTPEmail } = require('../services/email');

const router = express.Router();

// POST /api/auth/send-otp  — email-based OTP via Nodemailer
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await OTPStore.findOneAndDelete({ email });
    await OTPStore.create({ email, otp, expires_at });

    await sendOTPEmail(email, otp);

    const response = { success: true, message: 'OTP sent to your email' };
    if (process.env.NODE_ENV === 'development') response.dev_otp = otp;

    res.json(response);
  } catch (err) {
    console.error('[Auth] send-otp error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Check SMTP config.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, phone } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required' });
    }

    const record = await OTPStore.findOne({ email });
    if (!record) return res.status(400).json({ success: false, message: 'OTP not found or already used' });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    if (record.expires_at < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

    await OTPStore.findOneAndDelete({ email });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name: name || '', phone: phone || '', otp_verified: true });
    } else {
      user.otp_verified = true;
      user.last_login = new Date();
      if (name && !user.name) user.name = name;
      if (phone && !user.phone) user.phone = phone;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin-login — email + password
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        email: process.env.ADMIN_EMAIL,
        name: 'FUDO Admin',
        role: 'admin',
        otp_verified: true,
      });
    }

    const token = jwt.sign(
      { id: adminUser._id, role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: { id: adminUser._id, name: 'FUDO Admin', email, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => res.json({ success: true, message: 'Logged out' }));

module.exports = router;
