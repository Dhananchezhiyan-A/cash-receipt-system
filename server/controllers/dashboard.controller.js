const Receipt = require('../models/CashReceipt');
const Voucher = require('../models/PaymentVoucher');
const User = require('../models/User');

const sum = async (Model, filter) => {
  const result = await Model.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return result[0]?.total || 0;
};

const monthly = async (Model, filter, start) => Model.aggregate([
  { $match: { ...filter, date: { $gte: start } } },
  { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
]);

exports.stats = async (req, res) => {
  const privileged = req.user.role === 'admin' || req.user.role === 'manager';
  const userScope = privileged ? {} : { createdBy: req.user._id };
  const base = { deleted: false, ...userScope };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalIn,
    totalOut,
    totalReceipts,
    totalVouchers,
    todayIn,
    todayOut,
    monthIn,
    monthOut,
    recentReceipts,
    recentVouchers,
    receiptMonths,
    voucherMonths,
  ] = await Promise.all([
    sum(Receipt, base),
    sum(Voucher, base),
    Receipt.countDocuments(base),
    Voucher.countDocuments(base),
    sum(Receipt, { ...base, date: { $gte: today } }),
    sum(Voucher, { ...base, date: { $gte: today } }),
    sum(Receipt, { ...base, date: { $gte: monthStart } }),
    sum(Voucher, { ...base, date: { $gte: monthStart } }),
    Receipt.find(base).sort('-createdAt').limit(5).populate('createdBy', 'name'),
    Voucher.find(base).sort('-createdAt').limit(5).populate('createdBy', 'name'),
    monthly(Receipt, base, chartStart),
    monthly(Voucher, base, chartStart),
  ]);

  const monthMap = (rows) => new Map(rows.map((row) => [`${row._id.year}-${row._id.month}`, row]));
  const receiptMap = monthMap(receiptMonths);
  const voucherMap = monthMap(voucherMonths);
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    return {
      label: date.toLocaleString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      received: receiptMap.get(key)?.total || 0,
      paid: voucherMap.get(key)?.total || 0,
    };
  });

  const response = {
    totalIn,
    totalOut,
    netBalance: totalIn - totalOut,
    totalReceipts,
    totalVouchers,
    todayIn,
    todayOut,
    monthIn,
    monthOut,
    recentReceipts,
    recentVouchers,
    recentTransactions: [
      ...recentReceipts.map((item) => ({ ...item.toObject(), transactionType: 'receipt' })),
      ...recentVouchers.map((item) => ({ ...item.toObject(), transactionType: 'voucher' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    monthlyData,
  };

  if (privileged) {
    const userFilter = { deleted: { $ne: true } };
    const [totalUsers, activeUsers, inactiveUsers, admins, managers, normalUsers, recentUsers] = await Promise.all([
      User.countDocuments(userFilter),
      User.countDocuments({ ...userFilter, active: true }),
      User.countDocuments({ ...userFilter, active: false }),
      User.countDocuments({ ...userFilter, role: 'admin' }),
      User.countDocuments({ ...userFilter, role: 'manager' }),
      User.countDocuments({ ...userFilter, role: 'user' }),
      User.find(userFilter).select('-password').sort('-createdAt').limit(5),
    ]);
    response.users = { totalUsers, activeUsers, inactiveUsers, admins, managers, normalUsers };
    response.recentUsers = recentUsers;
  }

  res.json(response);
};

exports.transactions = async (req, res) => {
  const { q = '', type = 'all', from, to, paymentMode, page = 1, limit = 25, sortOrder = 'desc' } = req.query;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const base = { deleted: false };
  if (req.user.role === 'user') base.createdBy = req.user._id;
  if (paymentMode) base.paymentMode = paymentMode;
  if (from || to) {
    base.date = {};
    if (from) base.date.$gte = new Date(from);
    if (to) base.date.$lte = new Date(to);
  }

  const normalize = (items, transactionType) => items.map((item) => ({
    ...item.toObject(),
    transactionType,
  }));
  const receiptFilter = { ...base };
  const voucherFilter = { ...base };
  if (escaped) {
    receiptFilter.$or = [{ receiptNumber: new RegExp(escaped, 'i') }, { receivedFrom: new RegExp(escaped, 'i') }, { purpose: new RegExp(escaped, 'i') }];
    voucherFilter.$or = [{ voucherNumber: new RegExp(escaped, 'i') }, { paidTo: new RegExp(escaped, 'i') }, { purpose: new RegExp(escaped, 'i') }];
  }

  const [receipts, vouchers] = await Promise.all([
    type === 'out' ? [] : Receipt.find(receiptFilter).populate('createdBy', 'name email').lean(false),
    type === 'in' ? [] : Voucher.find(voucherFilter).populate('createdBy', 'name email').lean(false),
  ]);
  const direction = sortOrder === 'asc' ? 1 : -1;
  const all = [...normalize(receipts, 'receipt'), ...normalize(vouchers, 'voucher')]
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) * direction);
  const start = (safePage - 1) * safeLimit;
  res.json({
    items: all.slice(start, start + safeLimit),
    total: all.length,
    page: safePage,
    pages: Math.max(Math.ceil(all.length / safeLimit), 1),
    limit: safeLimit,
  });
};
