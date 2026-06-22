const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model('OTPStore', otpStoreSchema);
