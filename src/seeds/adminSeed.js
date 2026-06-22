require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('✅ Admin already exists:', existing.phone);
      process.exit(0);
    }

    const admin = await User.create({
      phone: 'admin',
      name: 'FUDO Admin',
      role: 'admin',
      otp_verified: true,
    });

    console.log('🔴 FUDO Admin seeded!');
    console.log('   Email:', process.env.ADMIN_EMAIL || 'admin@fudo.club');
    console.log('   Password:', process.env.ADMIN_PASSWORD || 'FudoAdmin@2024');
    console.log('   Login at: /admin');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
