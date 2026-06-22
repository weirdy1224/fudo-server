const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String },
  phone: { type: String, default: '' },
  otp_verified: { type: Boolean, default: false },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now },
});

// Unique index on email when set
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
