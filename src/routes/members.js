const express = require('express');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/members - admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'member' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const members = await User.find(filter).sort({ created_at: -1 });
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/members/:id - member profile with stats
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const [registrations, attendance] = await Promise.all([
      Registration.find({ user_id: req.params.id }).populate('session_id', 'title date type'),
      Attendance.find({ user_id: req.params.id }).populate('session_id', 'title date type'),
    ]);

    const totalRegistered = registrations.filter((r) => r.status !== 'cancelled').length;
    const totalAttended = attendance.filter((a) => a.attendance_status === 'present').length;
    const attendancePercent = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

    res.json({
      success: true,
      data: {
        member,
        stats: { totalRegistered, totalAttended, attendancePercent },
        registrations,
        attendance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
