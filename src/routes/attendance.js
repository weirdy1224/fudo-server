const express = require('express');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { verifyRegistrationQRToken } = require('../utils/qrToken');

const router = express.Router();

// POST /api/attendance - mark attendance (admin manual)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { session_id, user_id, attendance_status } = req.body;
    const record = await Attendance.findOneAndUpdate(
      { session_id, user_id },
      { attendance_status, marked_by: 'admin', marked_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/scan-qr - admin scans user QR code
router.post('/scan-qr', requireAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const payload = verifyRegistrationQRToken(token);
    if (!payload) return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });

    const { registrationId } = payload;

    // Find registration
    const reg = await Registration.findById(registrationId)
      .populate('user_id', 'name phone')
      .populate('session_id', 'title date type venue');

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Registration is not approved (status: ${reg.status})` });
    }

    // Check if attendance is already marked
    const existing = await Attendance.findOne({ session_id: reg.session_id._id, user_id: reg.user_id._id });
    if (existing && existing.attendance_status === 'present') {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked present',
        memberName: reg.user_id.name,
        sessionTitle: reg.session_id.title,
      });
    }

    // Mark present
    const record = await Attendance.findOneAndUpdate(
      { session_id: reg.session_id._id, user_id: reg.user_id._id },
      { attendance_status: 'present', marked_by: 'admin_qr', marked_at: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: record,
      memberName: reg.user_id.name,
      sessionTitle: reg.session_id.title,
      message: `Attendance marked present for ${reg.user_id.name}!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/session/:id - all attendance for a session
router.get('/session/:id', requireAdmin, async (req, res) => {
  try {
    const attendance = await Attendance.find({ session_id: req.params.id })
      .populate('user_id', 'name phone');
    
    // Also get registrations for this session to show unmarked
    const registrations = await Registration.find({ session_id: req.params.id, status: 'approved' })
      .populate('user_id', 'name phone');

    res.json({ success: true, data: { attendance, registrations } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/member/:id - member attendance history
router.get('/member/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const attendance = await Attendance.find({ user_id: req.params.id })
      .populate('session_id', 'title date type venue');
    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
