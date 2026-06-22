const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendance_status: { type: String, enum: ['present', 'absent'], required: true },
  marked_by: { type: String, enum: ['admin', 'qr'], default: 'admin' },
  marked_at: { type: Date, default: Date.now },
});

attendanceSchema.index({ session_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
