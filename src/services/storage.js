const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---------- Multer: always use memory storage ----------
// In production (Vercel) the filesystem is ephemeral/read-only, so we buffer
// the upload in RAM and then push it to Cloudinary.
// In local development, if CLOUDINARY_URL is not set we fall back to disk.

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only images and videos allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ---------- Cloudinary helpers ----------
let cloudinary = null;

const getCloudinary = () => {
  if (!cloudinary && process.env.CLOUDINARY_URL) {
    cloudinary = require('cloudinary').v2;
    // cloudinary.config() reads CLOUDINARY_URL automatically
  }
  return cloudinary;
};

/**
 * Upload a multer memory-buffer file to Cloudinary (production)
 * or save it to local disk (development fallback).
 * Returns the public URL string.
 */
const uploadFile = async (file) => {
  const cl = getCloudinary();

  if (cl) {
    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cl.uploader.upload_stream(
        { folder: 'fudo', resource_type: 'auto' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return result.secure_url;
  }

  // Dev fallback: write to local uploads dir
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = unique + path.extname(file.originalname);
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

/**
 * Delete a file by its URL.
 * - Cloudinary: extract public_id from the URL and destroy it.
 * - Local: delete from disk.
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  const cl = getCloudinary();

  if (cl && fileUrl.includes('cloudinary.com')) {
    // Extract public_id: everything between /upload/vXXX/ and the extension
    const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (match) await cl.uploader.destroy(match[1], { resource_type: 'auto' });
    return;
  }

  // Local fallback
  const uploadDir = path.join(__dirname, '../../uploads');
  const full = path.join(uploadDir, path.basename(fileUrl));
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

module.exports = { upload, uploadFile, deleteFile };
