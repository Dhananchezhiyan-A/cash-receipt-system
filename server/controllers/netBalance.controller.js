const NetBalance = require('../models/NetBalance');

async function addBalance(req, res) {
  try {
    const { amount, direction = 'credit', note } = req.body;
    const addedBy = req.user?.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }

    if (!['credit', 'debit'].includes(direction)) {
      return res.status(400).json({ message: 'Direction must be either "credit" or "debit"' });
    }

    // Get the most recent balance entry to calculate previous balance
    const lastEntry = await NetBalance.findOne().sort({ createdAt: -1 });
    const previousBalance = lastEntry?.updatedBalance || 0;

    // Calculate updated balance based on direction
    let updatedBalance;
    if (direction === 'credit') {
      updatedBalance = previousBalance + Number(amount);
    } else {
      updatedBalance = previousBalance - Number(amount);
    }

    const balance = await NetBalance.create({
      amount: Number(amount),
      direction,
      note: note || '',
      addedBy,
      transactionType: 'manual',
      transactionId: null,
      previousBalance,
      updatedBalance,
    });
    await balance.populate('addedBy', 'name');

    res.status(201).json({ message: 'Balance added successfully', data: balance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getTotalBalance(req, res) {
  try {
    // Calculate total by getting the last entry's updated balance
    const lastEntry = await NetBalance.findOne().sort({ createdAt: -1 });
    const total = lastEntry?.updatedBalance || 0;
    
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getLogs(req, res) {
  try {
    const { page = 1, limit = 50, month, year } = req.query;
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    let filter = {};
    if (month && year) {
      const monthIndex = new Date(`${year}-${month}-1`).getMonth();
      const startDate = new Date(Number(year), monthIndex, 1);
      const endDate = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59);
      filter = { date: { $gte: startDate, $lte: endDate } };
    }

    const [logs, totalCount] = await Promise.all([
      NetBalance.find(filter).sort({ createdAt: -1 }).limit(safeLimit).skip((safePage - 1) * safeLimit).populate('addedBy', 'name'),
      NetBalance.countDocuments(filter)
    ]);

    res.json({
      items: logs,
      total: totalCount,
      page: safePage,
      pages: Math.max(Math.ceil(totalCount / safeLimit), 1),
      limit: safeLimit
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getCount(req, res) {
  try {
    const { month, year } = req.query;
    let filter = {};
    
    if (month && year) {
      const monthIndex = new Date(`${year}-${month}-1`).getMonth();
      const startDate = new Date(Number(year), monthIndex, 1);
      const endDate = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59);
      filter = { date: { $gte: startDate, $lte: endDate } };
    }

    const count = await NetBalance.countDocuments(filter);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// NEW: Recalculate all previous and updated balances
async function recalculate(req, res) {
  try {
    // Get all logs sorted by creation date (oldest first)
    const allLogs = await NetBalance.find().sort({ createdAt: 1 });
    
    let runningBalance = 0;
    const updates = [];

    // Calculate running balance for each entry
    for (const log of allLogs) {
      const previousBalance = runningBalance;
      
      // Determine transaction type and calculate balance change
      let balanceChange = 0;
      
      if (log.transactionType === 'receipt') {
        // Receipts always increase balance (amount is positive)
        balanceChange = Math.abs(log.amount);
      } else if (log.transactionType === 'voucher') {
        // Vouchers always decrease balance (amount is negative, so negate it)
        balanceChange = -Math.abs(log.amount);
      } else if (log.transactionType === 'manual') {
        // Manual transactions use direction field
        if (log.direction === 'credit') {
          balanceChange = Math.abs(log.amount);
        } else if (log.direction === 'debit') {
          balanceChange = -Math.abs(log.amount);
        }
      }
      
      runningBalance += balanceChange;

      updates.push({
        id: log._id,
        previousBalance,
        updatedBalance: runningBalance
      });
    }

    // Apply all updates
    for (const update of updates) {
      await NetBalance.findByIdAndUpdate(update.id, {
        previousBalance: update.previousBalance,
        updatedBalance: update.updatedBalance
      });
    }

    res.json({
      message: `Successfully recalculated ${updates.length} balance logs`,
      count: updates.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { addBalance, getTotalBalance, getLogs, getCount, recalculate };