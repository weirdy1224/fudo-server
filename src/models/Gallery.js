const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  media_url: { type: String, required: true },
  media_type: { type: String, enum: ['image', 'video'], default: 'image' },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Gallery', gallerySchema);
