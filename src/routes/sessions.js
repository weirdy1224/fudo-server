const express = require('express');
const Session = require('../models/Session');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload, uploadFile, deleteFile } = require('../services/storage');

const router = express.Router();

// GET /api/sessions - public
router.get('/', async (req, res) => {
  try {
    const { type, status, featured, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    else filter.status = { $in: ['published', 'completed'] };
    if (featured === 'true') filter.featured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sessions, total] = await Promise.all([
      Session.find(filter).sort({ date: 1 }).skip(skip).limit(parseInt(limit)),
      Session.countDocuments(filter),
    ]);
    res.json({ success: true, data: sessions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sessions/featured - nearest featured or upcoming
router.get('/featured', async (req, res) => {
  try {
    let session = await Session.findOne({ featured: true, status: 'published', date: { $gte: new Date() } }).sort({ date: 1 });
    if (!session) session = await Session.findOne({ status: 'published', date: { $gte: new Date() } }).sort({ date: 1 });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sessions/ticker - for the homepage ticker
router.get('/ticker', async (req, res) => {
  try {
    const session = await Session.findOne({ status: 'published', date: { $gte: new Date() } }).sort({ date: 1 });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sessions - admin only
router.post('/', requireAdmin, upload.single('banner_image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.banner_image = await uploadFile(req.file);
    if (data.is_free === 'true') data.is_free = true;
    if (data.is_free === 'false') data.is_free = false;
    if (data.featured === 'true') data.featured = true;
    if (data.capacity === '' || data.capacity === 'null') data.capacity = null;
    const session = await Session.create(data);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/sessions/:id - admin only
router.put('/:id', requireAdmin, upload.single('banner_image'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const data = { ...req.body };
    if (req.file) {
      if (session.banner_image) await deleteFile(session.banner_image);
      data.banner_image = await uploadFile(req.file);
    }
    if (data.capacity === '' || data.capacity === 'null') data.capacity = null;

    const updated = await Session.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/sessions/:id - admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.banner_image) await deleteFile(session.banner_image);
    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
