const cron = require('node-cron');
const Session = require('../models/Session');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { send24HourReminder, send2HourReminder } = require('../services/whatsapp');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Checking session reminders...');
  try {
    const now = new Date();

    // 24-hour reminder window: sessions happening in 23-25 hours
    const in24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 2-hour reminder window: sessions happening in 1.5-2.5 hours
    const in2hStart = new Date(now.getTime() + 90 * 60 * 1000);
    const in2hEnd = new Date(now.getTime() + 150 * 60 * 1000);

    const [sessions24h, sessions2h] = await Promise.all([
      Session.find({ status: 'published', date: { $gte: in24hStart, $lte: in24hEnd } }),
      Session.find({ status: 'published', date: { $gte: in2hStart, $lte: in2hEnd } }),
    ]);

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
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Reminder job error:', err.message);
  }
});

console.log('[Cron] Session reminder job scheduled');
