const CashReceipt = require('../models/CashReceipt');
const NetBalance = require('../models/NetBalance');

const MAX_RETRIES = 5;

exports.create = async (req, res) => {
  let doc;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const last = await CashReceipt.findOne({}).sort({ createdAt: -1 });
    let num = 1;
    if (last && last.receiptNumber) {
      const match = last.receiptNumber.match(/RN(\d+)/);
      if (match) num = parseInt(match[1], 10) + 1;
    }
    const receiptNumber = `RN${String(num).padStart(4, '0')}`;
    try {
      doc = await CashReceipt.create({ ...req.body, receiptNumber, createdBy: req.user._id });
      // Record net balance increase for this receipt
      try {
        const agg = await NetBalance.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
        const previousBalance = agg[0]?.total || 0;
        const amount = Number(doc.amount);
        const updatedBalance = previousBalance + amount;
        await NetBalance.create({ amount, note: `Receipt ${doc.receiptNumber}`, addedBy: req.user._id, transactionType: 'receipt', transactionId: doc._id, previousBalance, updatedBalance });
      } catch (nbErr) {
        console.error('Failed to record net balance for receipt:', nbErr);
      }
      break;
    } catch (err) {
      if (err.code === 11000 && attempt < MAX_RETRIES - 1) continue;
      throw err;
    }
  }
  res.status(201).json(doc);
};
exports.list = async (req, res) => {
  const { q, from, to, paymentMode, page = 1, limit = 25, sortBy = 'date', sortOrder = 'desc' } = req.query;
  const filter = { deleted: false };
  const escaped = String(q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escaped) filter.$or = [
    { receiptNumber: new RegExp(escaped, 'i') },
    { receivedFrom: new RegExp(escaped, 'i') },
    { purpose: new RegExp(escaped, 'i') },
  ];
  if (paymentMode) filter.paymentMode = paymentMode;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeSort = ['receiptNumber', 'date', 'receivedFrom', 'paymentMode', 'amount', 'createdAt'].includes(sortBy) ? sortBy : 'date';
  const skip = (safePage - 1) * safeLimit;
  const [items, total] = await Promise.all([
    CashReceipt.find(filter).populate('createdBy', 'name email').sort({ [safeSort]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(safeLimit),
    CashReceipt.countDocuments(filter),
  ]);
  res.json({ items, total, page: safePage, pages: Math.max(Math.ceil(total / safeLimit), 1), limit: safeLimit });
};
exports.get = async (req, res) => {
  const doc = await CashReceipt.findOne({ _id: req.params.id, deleted: false }).populate('createdBy', 'name email');
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};
exports.update = async (req, res) => {
  const existing = await CashReceipt.findOne({ _id: req.params.id, deleted: false });
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const oldAmount = Number(existing.amount || 0);
  const doc = await CashReceipt.findOneAndUpdate(
    { _id: req.params.id, deleted: false },
    req.body,
    { new: true, runValidators: true },
  );
  // If amount changed, record delta in NetBalance
  try {
    const newAmount = Number(doc.amount || 0);
    const delta = newAmount - oldAmount; // positive increases net balance
    if (delta !== 0) {
      try {
        const agg = await NetBalance.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
        const previousBalance = agg[0]?.total || 0;
        const updatedBalance = previousBalance + delta;
        await NetBalance.create({ amount: delta, note: `Update Receipt ${doc.receiptNumber}`, addedBy: req.user._id, transactionType: 'receipt', transactionId: doc._id, previousBalance, updatedBalance });
      } catch (nbErr) {
        console.error('Failed to record net balance delta for receipt update:', nbErr);
      }
    }
  } catch (nbErr) {
    console.error('Failed to record net balance delta for receipt update:', nbErr);
  }
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};
exports.remove = async (req, res) => {
  const doc = await CashReceipt.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await CashReceipt.findByIdAndUpdate(req.params.id, { deleted: true });
  try {
    // Deleting receipt reduces net balance
    try {
      const agg = await NetBalance.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
      const previousBalance = agg[0]?.total || 0;
      const amount = -Number(doc.amount || 0);
      const updatedBalance = previousBalance + amount;
      await NetBalance.create({ amount, note: `Deleted Receipt ${doc.receiptNumber}`, addedBy: req.user._id, transactionType: 'receipt', transactionId: doc._id, previousBalance, updatedBalance });
    } catch (nbErr) {
      console.error('Failed to record net balance for receipt deletion:', nbErr);
    }
  } catch (nbErr) {
    console.error('Failed to record net balance for receipt deletion:', nbErr);
  }
  res.json({ message: 'Deleted' });
};