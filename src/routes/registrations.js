const express = require('express');
const Registration = require('../models/Registration');
const Session = require('../models/Session');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendRegistrationConfirmation } = require('../services/whatsapp');
const User = require('../models/User');
const { generateRegistrationQRToken, generateRegistrationQRDataURL } = require('../utils/qrToken');
const { sendRegistrationConfirmationEmail, sendBadmintonRegistrationEmail } = require('../services/email');

const router = express.Router();

// POST /api/registrations - member registers for a session
router.post('/', requireAuth, async (req, res) => {
  try {
    const { session_id } = req.body;
    const user_id = req.user.id;

    const session = await Session.findById(session_id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'published') return res.status(400).json({ success: false, message: 'Session not open for registration' });

    // Check capacity for paid/badminton sessions
    if (session.capacity !== null && session.registration_count >= session.capacity) {
      return res.status(400).json({ success: false, message: 'Session is full' });
    }

    // Check duplicate
    let registration = await Registration.findOne({ user_id, session_id });
    let isRestore = false;
    if (registration) {
      if (registration.status === 'cancelled') {
        registration.status = 'approved';
        await registration.save();
        await Session.findByIdAndUpdate(session_id, { $inc: { registration_count: 1 } });
        isRestore = true;
      } else {
        return res.status(400).json({ success: false, message: 'Already registered' });
      }
    } else {
      registration = await Registration.create({ user_id, session_id });
      await Session.findByIdAndUpdate(session_id, { $inc: { registration_count: 1 } });
    }

    const user = await User.findById(user_id);
    const isBadminton = session.type === 'badminton';

    // Generate Token & QR Code for entry (only if not badminton)
    let token = null;
    if (!isBadminton) {
      token = generateRegistrationQRToken(
        registration._id,
        user?.name || 'Member',
        session.title,
        session.date
      );
    }

    // Email notification
    try {
      if (user?.email) {
        if (isBadminton) {
          await sendBadmintonRegistrationEmail(user.email, user, session);
        } else {
          const qrDataURL = await generateRegistrationQRDataURL(token);
          await sendRegistrationConfirmationEmail(user.email, user, session, qrDataURL);
        }
      }
    } catch (emailErr) {
      console.error('Registration confirmation email failed:', emailErr.message);
    }

    // WhatsApp notification
    try {
      if (user?.phone) {
        await sendRegistrationConfirmation(
          user.phone,
          {
            title: session.title,
            date: new Date(session.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: session.start_time,
            venue: session.venue,
          },
          token
        );
      }
    } catch (waErr) {
      console.error('WhatsApp notification failed:', waErr.message);
    }

    res.status(201).json({
      success: true,
      data: registration,
      qrToken: token || undefined,
      message: isRestore ? 'Registration restored' : undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/registrations - admin: all, member: own
router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user_id: req.user.id };
    const { session_id, status, search } = req.query;
    if (session_id) filter.session_id = session_id;
    if (status) filter.status = status;

    let registrations = await Registration.find(filter)
      .populate('user_id', 'name phone created_at')
      .populate('session_id', 'title date type venue')
      .sort({ registered_at: -1 });

    if (search) {
      const s = search.toLowerCase();
      registrations = registrations.filter(
        (r) => r.user_id?.name?.toLowerCase().includes(s) || r.user_id?.phone?.includes(s)
      );
    }

    const dataWithTokens = registrations.map((r) => {
      const rObj = r.toObject();
      if (r.status === 'approved' && r.session_id && r.session_id.type !== 'badminton') {
        rObj.qrToken = generateRegistrationQRToken(
          r._id,
          r.user_id?.name || 'Member',
          r.session_id?.title || 'Session',
          r.session_id?.date
        );
      }
      return rObj;
    });

    res.json({ success: true, data: dataWithTokens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/registrations/:id/status - admin approve/reject/cancel
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    const prevStatus = reg.status;
    reg.status = status;
    await reg.save();

    // Adjust count if cancelling
    if (prevStatus !== 'cancelled' && status === 'cancelled') {
      await Session.findByIdAndUpdate(reg.session_id, { $inc: { registration_count: -1 } });
    }
    if (prevStatus === 'cancelled' && status === 'approved') {
      await Session.findByIdAndUpdate(reg.session_id, { $inc: { registration_count: 1 } });
    }

    res.json({ success: true, data: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
