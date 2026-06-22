const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['gym', 'badminton', 'event'], required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  venue: { type: String, required: true },
  price: { type: Number, default: 0 },
  is_free: { type: Boolean, default: true },
  capacity: { type: Number, default: null }, // null = unlimited
  banner_image: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'completed', 'cancelled'], default: 'draft' },
  notify_members: { type: Boolean, default: false },
  registration_count: { type: Number, default: 0 },
  google_maps_url: { type: String, default: '' },
  apple_maps_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
