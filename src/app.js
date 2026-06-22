require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const registrationRoutes = require('./routes/registrations');
const attendanceRoutes = require('./routes/attendance');
const memberRoutes = require('./routes/members');
const recapRoutes = require('./routes/recaps');
const galleryRoutes = require('./routes/gallery');
const contactRoutes = require('./routes/contact');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const cronRoutes = require('./routes/cron');

const app = express();

// Connect to MongoDB (cached for serverless)
connectDB();

// Only run node-cron in non-serverless environments (local dev)
if (!process.env.VERCEL) {
  require('./jobs/reminderJob');
}

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (local dev only; Cloudinary handles prod)
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/recaps', recapRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', message: 'FUDO API running 💪' })
);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
