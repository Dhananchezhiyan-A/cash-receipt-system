/**
 * Migration script to recalculate Previous and Updated balances for all Net Balance entries
 * This script:
 * 1. Fetches all balance logs sorted by creation date (oldest first)
 * 2. Recalculates running balance for each entry
 * 3. Sets direction to 'credit' for positive amounts and 'debit' for any edge cases
 * 4. Updates each record with correct previousBalance and updatedBalance
 * 
 * Run: node scripts/recalculateBalance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const NetBalance = require('../models/NetBalance');

async function recalculateBalances() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app');
    console.log('✓ Connected to MongoDB');

    // Fetch all logs sorted by creation date (oldest first)
    const logs = await NetBalance.find().sort({ createdAt: 1 });
    console.log(`\nProcessing ${logs.length} balance logs...`);

    let runningBalance = 0;
    const updates = [];

    // Recalculate each entry
    logs.forEach((log, index) => {
      const previousBalance = runningBalance;
      
      // Set direction to 'credit' if not already set
      const direction = log.direction || 'credit';
      
      // Calculate updated balance
      let updatedBalance;
      if (direction === 'credit') {
        updatedBalance = previousBalance + log.amount;
      } else {
        updatedBalance = previousBalance - log.amount;
      }

      updates.push({
        id: log._id,
        previousBalance,
        updatedBalance,
        direction,
        amount: log.amount,
        note: log.note || 'N/A',
        date: log.createdAt
      });

      runningBalance = updatedBalance;
    });

    // Apply all updates
    let successCount = 0;
    for (const update of updates) {
      await NetBalance.findByIdAndUpdate(update.id, {
        previousBalance: update.previousBalance,
        updatedBalance: update.updatedBalance,
        direction: update.direction
      });
      successCount++;
      
      if ((successCount) % 10 === 0) {
        console.log(`  ✓ Updated ${successCount}/${updates.length} records`);
      }
    }

    console.log(`\n✓ Successfully recalculated ${successCount} balance logs`);
    console.log(`\nSample calculations:`);
    updates.slice(0, 5).forEach((u, i) => {
      console.log(`  Entry ${i + 1}: Previous ₹${u.previousBalance} → Updated ₹${u.updatedBalance} (${u.direction.toUpperCase()} ₹${u.amount})`);
    });
    if (updates.length > 5) {
      console.log(`  ... and ${updates.length - 5} more entries`);
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

// Run the migration
recalculateBalances();
