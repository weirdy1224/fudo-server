const express = require('express');
const Session = require('../models/Session');
const Registration = require('../models/Registration');
const { send24HourReminder, send2HourReminder } = require('../services/whatsapp');

const router = express.Router();

/**
 * GET /api/cron/reminders
 * Called hourly by Vercel Cron (configured in vercel.json).
 * Protected by CRON_SECRET env variable.
 * In local dev, node-cron calls the reminder logic directly (jobs/reminderJob.js).
 */
router.get('/reminders', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const now = new Date();

    const in24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in2hStart = new Date(now.getTime() + 90 * 60 * 1000);
    const in2hEnd = new Date(now.getTime() + 150 * 60 * 1000);

    const [sessions24h, sessions2h] = await Promise.all([
      Session.find({ status: 'published', date: { $gte: in24hStart, $lte: in24hEnd } }),
      Session.find({ status: 'published', date: { $gte: in2hStart, $lte: in2hEnd } }),
    ]);

    let sent = 0;

    for (const session of sessions24h) {
      const regs = await Registration.find({ session_id: session._id, status: 'approved' }).populate('user_id', 'phone');
      for (const reg of regs) {
        if (reg.user_id?.phone) {
          await send24HourReminder(reg.user_id.phone, {
            title: session.title,
            date: new Date(session.date).toLocaleDateString('en-IN'),
            time: session.start_time,
            venue: session.venue,
          });
          sent++;
        }
      }
    }

    for (const session of sessions2h) {
      const regs = await Registration.find({ session_id: session._id, status: 'approved' }).populate('user_id', 'phone');
      for (const reg of regs) {
        if (reg.user_id?.phone) {
          await send2HourReminder(reg.user_id.phone, {
            title: session.title,
            date: new Date(session.date).toLocaleDateString('en-IN'),
            time: session.start_time,
            venue: session.venue,
          });
          sent++;
        }
      }
    }

    res.json({ success: true, message: `Reminders sent: ${sent}` });
  } catch (err) {
    console.error('[Cron] Reminder job error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
