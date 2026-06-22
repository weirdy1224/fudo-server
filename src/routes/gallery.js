const express = require('express');
const Gallery = require('../models/Gallery');
const { requireAdmin } = require('../middleware/auth');
const { upload, uploadFile, deleteFile } = require('../services/storage');

const router = express.Router();

// GET /api/gallery - public
router.get('/', async (req, res) => {
  try {
    const { session_id, media_type } = req.query;
    const filter = {};
    if (session_id) filter.session_id = session_id;
    if (media_type) filter.media_type = media_type;
    const gallery = await Gallery.find(filter).sort({ display_order: 1, created_at: -1 });
    res.json({ success: true, data: gallery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/gallery - admin only
router.post('/', requireAdmin, upload.single('media'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.media_url = await uploadFile(req.file);
    const item = await Gallery.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/gallery/reorder - update display orders
router.put('/reorder', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body; // [{ id, display_order }]
    await Promise.all(items.map((item) => Gallery.findByIdAndUpdate(item.id, { display_order: item.display_order })));
    res.json({ success: true, message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/gallery/:id - admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    await deleteFile(item.media_url);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
