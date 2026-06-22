const mongoose = require('mongoose');

const recapMediaSchema = new mongoose.Schema({
  recap_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recap', required: true },
  media_url: { type: String, required: true },
  media_type: { type: String, enum: ['image', 'video'], default: 'image' },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RecapMedia', recapMediaSchema);
