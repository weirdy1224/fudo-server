const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  registered_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'approved' },
});

registrationSchema.index({ user_id: 1, session_id: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
