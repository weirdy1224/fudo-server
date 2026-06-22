const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact - public
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const msg = await ContactMessage.create({ name, phone, email, message });
    res.status(201).json({ success: true, data: msg, message: 'Message sent! FUDO team will get back to you.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/contact - admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ created_at: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
