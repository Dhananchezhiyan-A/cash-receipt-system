require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cash-receipt-system';
    await mongoose.connect(uri, { maxPoolSize: 5 });
    const email = 'admin@dreamcode.tech';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', existing._id.toString());
      await mongoose.disconnect();
      process.exit(0);
    }
    const admin = await User.create({ name: 'Admin', email, password: 'admin123', role: 'admin', active: true });
    console.log('Created admin:', admin.email, admin._id.toString());
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
