require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cash-receipt-system';
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { maxPoolSize: 5 });
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    const toDrop = cols.map(c => c.name).filter(n => !n.startsWith('system.'));
    if (toDrop.length === 0) {
      console.log('No user collections found to drop.');
    } else {
      for (const name of toDrop) {
        try {
          await db.dropCollection(name);
          console.log('Dropped collection:', name);
        } catch (e) {
          console.warn('Could not drop collection', name, e.message);
        }
      }
    }

    // Remove uploads folder contents
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('Removing uploads directory contents:', uploadsDir);
      // remove contents but keep uploads folder
      for (const entry of fs.readdirSync(uploadsDir)) {
        const full = path.join(uploadsDir, entry);
        try {
          fs.rmSync(full, { recursive: true, force: true });
          console.log('Removed:', full);
        } catch (err) {
          console.warn('Failed to remove', full, err.message);
        }
      }
    } else {
      console.log('No uploads directory found at', uploadsDir);
    }

    console.log('Purge complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Purge failed:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
