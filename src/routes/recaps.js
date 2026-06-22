const express = require('express');
const jwt = require('jsonwebtoken');
const Recap = require('../models/Recap');
const RecapMedia = require('../models/RecapMedia');
const { requireAdmin } = require('../middleware/auth');
const { upload, uploadFile, deleteFile } = require('../services/storage');

const router = express.Router();

// GET /api/recaps - public (optionally admin authenticated via Bearer token to show drafts)
router.get('/', async (req, res) => {
  try {
    const { featured, status, limit = 10, page = 1 } = req.query;
    
    // Check if requester is admin
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.role === 'admin') {
          isAdmin = true;
        }
      } catch (err) {}
    }

    const filter = {};
    if (isAdmin && status === 'all') {
      // Admin request to see all recaps including drafts
    } else {
      filter.publish_status = 'published';
    }

    if (featured === 'true') filter.featured = true;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [recaps, total] = await Promise.all([
      Recap.find(filter).populate('session_id', 'title date type').sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
      Recap.countDocuments(filter),
    ]);

    // Attach media
    const recapsWithMedia = await Promise.all(
      recaps.map(async (recap) => {
        const media = await RecapMedia.find({ recap_id: recap._id }).sort({ display_order: 1 });
        return { ...recap.toObject(), media };
      })
    );

    res.json({ success: true, data: recapsWithMedia, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/recaps/:id
router.get('/:id', async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id).populate('session_id', 'title date type venue');
    if (!recap) return res.status(404).json({ success: false, message: 'Recap not found' });
    const media = await RecapMedia.find({ recap_id: recap._id }).sort({ display_order: 1 });
    res.json({ success: true, data: { ...recap.toObject(), media } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recaps - admin only
router.post('/', requireAdmin, upload.array('images', 20), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.session_id === '') delete data.session_id;

    // Upload all files first, then assign cover
    let uploadedUrls = [];
    if (req.files?.length) {
      uploadedUrls = await Promise.all(req.files.map((f) => uploadFile(f)));
      data.cover_image = uploadedUrls[0];
    }
    const recap = await Recap.create(data);

    if (uploadedUrls.length) {
      const mediaItems = uploadedUrls.map((url, idx) => ({
        recap_id: recap._id,
        media_url: url,
        media_type: 'image',
        display_order: idx,
      }));
      await RecapMedia.insertMany(mediaItems);
    }

    res.status(201).json({ success: true, data: recap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/recaps/:id - admin only
router.put('/:id', requireAdmin, upload.array('images', 20), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.session_id === '') data.session_id = null;

    let uploadedUrls = [];
    if (req.files?.length) {
      uploadedUrls = await Promise.all(req.files.map((f) => uploadFile(f)));
      data.cover_image = uploadedUrls[0];
    }
    const recap = await Recap.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!recap) return res.status(404).json({ success: false, message: 'Recap not found' });

    if (uploadedUrls.length) {
      const mediaItems = uploadedUrls.map((url, idx) => ({
        recap_id: recap._id,
        media_url: url,
        media_type: 'image',
        display_order: idx,
      }));
      await RecapMedia.insertMany(mediaItems);
    }

    res.json({ success: true, data: recap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/recaps/:id - admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const recap = await Recap.findByIdAndDelete(req.params.id);
    if (!recap) return res.status(404).json({ success: false, message: 'Recap not found' });
    const media = await RecapMedia.find({ recap_id: req.params.id });
    await Promise.all(media.map((m) => deleteFile(m.media_url)));
    await RecapMedia.deleteMany({ recap_id: req.params.id });
    res.json({ success: true, message: 'Recap deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
