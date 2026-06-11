const Model = require('../models/PaymentVoucher');
const scope = (user) => user.role === 'user' ? { createdBy: user._id, deleted: false } : { deleted: false };

exports.create = async (req, res) => res.status(201).json(await Model.create({ ...req.body, createdBy: req.user._id }));
exports.list = async (req, res) => {
  const { q, from, to, paymentMode, page = 1, limit = 25, sortBy = 'date', sortOrder = 'desc' } = req.query;
  const filter = scope(req.user);
  const escaped = String(q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escaped) filter.$or = [
    { voucherNumber: new RegExp(escaped, 'i') },
    { paidTo: new RegExp(escaped, 'i') },
    { purpose: new RegExp(escaped, 'i') },
  ];
  if (paymentMode) filter.paymentMode = paymentMode;
  if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeSort = ['voucherNumber', 'date', 'paidTo', 'paymentMode', 'amount', 'createdAt'].includes(sortBy) ? sortBy : 'date';
  const skip = (safePage - 1) * safeLimit;
  const [items, total] = await Promise.all([
    Model.find(filter).populate('createdBy', 'name email').sort({ [safeSort]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(safeLimit),
    Model.countDocuments(filter),
  ]);
  res.json({ items, total, page: safePage, pages: Math.max(Math.ceil(total / safeLimit), 1), limit: safeLimit });
};
exports.get = async (req, res) => {
  const doc = await Model.findOne({ _id: req.params.id, ...scope(req.user) }).populate('createdBy', 'name email');
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};
exports.update = async (req, res) => {
  if (req.user.role === 'manager') return res.status(403).json({ message: 'Managers have read-only transaction access' });
  const doc = await Model.findOneAndUpdate(
    { _id: req.params.id, ...scope(req.user) },
    req.body,
    { new: true, runValidators: true },
  );
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};
exports.remove = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can delete' });
  await Model.findByIdAndUpdate(req.params.id, { deleted: true });
  res.json({ message: 'Deleted' });
};
