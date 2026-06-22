const axios = require('axios');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

const sendMessage = async (phone, message) => {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.log('[WhatsApp] Credentials not set — skipping send.');
    return;
  }
  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
  }
};

const sendRegistrationConfirmation = async (phone, session, token) => {
  let msg;
  if (!token) {
    msg = `✅ *FUDO Badminton Registration Received!*\n\n📌 *${session.title}*\n📅 ${session.date}\n🕐 ${session.time}\n📍 ${session.venue}\n\nA FUDO representative will contact you shortly via WhatsApp/Phone to share final payment and venue details.\n\nSee you there! 🏸\n\n_FUDO Lifting Club_`;
  } else {
    const viewQrLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/member/registration-qr/${token}`;
    msg = `✅ *FUDO Registration Confirmed!*\n\n📌 *${session.title}*\n📅 ${session.date}\n🕐 ${session.time}\n📍 ${session.venue}\n\nShow your entry QR code to the admin at entrance:\n🔗 ${viewQrLink}\n\nSee you there! 💪\n\n_FUDO Lifting Club_`;
  }
  await sendMessage(phone, msg);
};

const send24HourReminder = async (phone, session) => {
  const msg = `🔔 *FUDO Reminder — Tomorrow!*\n\n📌 *${session.title}*\n📅 ${session.date}\n🕐 ${session.time}\n📍 ${session.venue}\n\nDon't forget — see you there! 🔥\n\n_FUDO Lifting Club_`;
  await sendMessage(phone, msg);
};

const send2HourReminder = async (phone, session) => {
  const msg = `⏰ *Starting in 2 Hours!*\n\n📌 *${session.title}*\n🕐 ${session.time}\n📍 ${session.venue}\n\nGet ready, FUDO fam! 💪\n\n_FUDO Lifting Club_`;
  await sendMessage(phone, msg);
};

const sendCancellationNotice = async (phone, session) => {
  const msg = `❌ *Session Cancelled*\n\n📌 *${session.title}* on ${session.date} has been cancelled.\n\nWe'll update you on the next session soon!\n\n_FUDO Lifting Club_`;
  await sendMessage(phone, msg);
};

const broadcastMessage = async (phones, message) => {
  for (const phone of phones) {
    await sendMessage(phone, message);
    await new Promise((r) => setTimeout(r, 200));
  }
};

module.exports = { sendRegistrationConfirmation, send24HourReminder, send2HourReminder, sendCancellationNotice, broadcastMessage };
