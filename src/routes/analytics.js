const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const Session = require('../models/Session');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMembers,
      activeMembers,
      totalSessions,
      upcomingSessions,
      monthlyRegistrations,
      badmintonRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      User.countDocuments({ role: 'member', last_login: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'published', date: { $gte: now } }),
      Registration.countDocuments({ registered_at: { $gte: monthStart } }),
      Registration.countDocuments({
        registered_at: { $gte: monthStart },
        session_id: { $in: await Session.find({ type: 'badminton' }).distinct('_id') },
      }),
    ]);

    res.json({
      success: true,
      data: { totalMembers, activeMembers, totalSessions, upcomingSessions, monthlyRegistrations, badmintonRegistrations },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/sessions - session analytics
router.get('/sessions', requireAdmin, async (req, res) => {
  try {
    // Top 5 most registered sessions
    const topSessions = await Registration.aggregate([
      { $group: { _id: '$session_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'sessions', localField: '_id', foreignField: '_id', as: 'session' } },
      { $unwind: '$session' },
      { $project: { title: '$session.title', type: '$session.type', date: '$session.date', count: 1 } },
    ]);

    // Monthly registration trend (last 6 months)
    const trend = await Registration.aggregate([
      { $match: { registered_at: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { year: { $year: '$registered_at' }, month: { $month: '$registered_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, data: { topSessions, trend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/members - member analytics
router.get('/members', requireAdmin, async (req, res) => {
  try {
    // Most active members by registration count
    const topMembers = await Registration.aggregate([
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', phone: '$user.phone', count: 1 } },
    ]);

    // New members per month (last 6 months)
    const newMembersTrend = await User.aggregate([
      { $match: { role: 'member', created_at: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, data: { topMembers, newMembersTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
