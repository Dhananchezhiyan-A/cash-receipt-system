require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  const users = [
    { name: 'Admin', email: 'admin@dreamcode.tech', password: 'admin123', role: 'admin' },
    { name: 'Manager', email: 'manager@dreamcode.tech', password: 'manager123', role: 'manager' },
    { name: 'User', email: 'user@dreamcode.tech', password: 'user123', role: 'user' },
  ];
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) { await User.create(u); console.log('Created', u.email); }
    else console.log('Skip existing', u.email);
  }
  await mongoose.disconnect();
  process.exit(0);
})();
