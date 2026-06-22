const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { broadcastMessage } = require('../services/whatsapp');
const Registration = require('../models/Registration');
const User = require('../models/User');

const router = express.Router();

// POST /api/notifications/send
router.post('/send', requireAdmin, async (req, res) => {
  try {
    const { target, session_id, message } = req.body;
    let phones = [];

    if (target === 'all') {
      const users = await User.find({ role: 'member', otp_verified: true });
      phones = users.map((u) => u.phone).filter(Boolean);
    } else if (target === 'session' && session_id) {
      const regs = await Registration.find({ session_id, status: 'approved' }).populate('user_id', 'phone');
      phones = regs.map((r) => r.user_id?.phone).filter(Boolean);
    }

    if (!phones.length) return res.status(400).json({ success: false, message: 'No recipients found' });

    // Send async (don't wait)
    broadcastMessage(phones, message).catch(console.error);

    res.json({ success: true, message: `Broadcasting to ${phones.length} members...` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
