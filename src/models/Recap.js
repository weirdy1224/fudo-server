const mongoose = require('mongoose');

const recapSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  attendee_count: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  publish_status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  cover_image: { type: String, default: '' },
  instagram_reel_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recap', recapSchema);
