const Receipt = require('../models/CashReceipt');
const Voucher = require('../models/PaymentVoucher');
const NetBalance = require('../models/NetBalance');

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
  const base = { deleted: false };
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

  // Calculate net balance from NetBalance ledger (captures receipts, vouchers, and manual additions)
  const netAgg = await NetBalance.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
  const totalNetBalance = netAgg[0]?.total || 0;

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

  res.json({
    totalIn,
    totalOut,
    netBalance: totalNetBalance,
    totalReceipts,
    totalVouchers,
    todayIn,
    todayOut,
    monthIn,
    monthOut,
    recentReceipts,
    recentVouchers,
    monthlyData,
  });
};

exports.transactions = async (req, res) => {
  const { q = '', type = 'all', from, to, paymentMode, page = 1, limit = 25, sortOrder = 'desc' } = req.query;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const base = { deleted: false };
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
  // Attach latest net-balance audit (previous/updated) for each transaction if available
  try {
    const ids = all.map((it) => it._id);
    if (ids.length > 0) {
      const netAgg = await NetBalance.aggregate([
        { $match: { transactionId: { $in: ids } } },
        { $sort: { date: -1 } },
        { $group: { _id: '$transactionId', doc: { $first: '$$ROOT' } } },
      ]);
      const balanceMap = new Map(netAgg.map((r) => [String(r._id), r.doc]));
      all.forEach((item) => {
        const entry = balanceMap.get(String(item._id));
        if (entry) {
          item.previousBalance = entry.previousBalance;
          item.updatedBalance = entry.updatedBalance;
        } else {
          item.previousBalance = null;
          item.updatedBalance = null;
        }
      });
    }
  } catch (err) {
    console.error('Failed to attach net balance audit to transactions:', err);
  }

  res.json({
    items: all.slice(start, start + safeLimit),
    total: all.length,
    page: safePage,
    pages: Math.max(Math.ceil(all.length / safeLimit), 1),
    limit: safeLimit,
  });
};