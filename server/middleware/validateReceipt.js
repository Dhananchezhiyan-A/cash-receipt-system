const PAYMENT_MODES = new Set(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'IMPS', 'Card', 'Other']);

const configs = {
  receipt: {
    number: 'receiptNumber',
    party: 'receivedFrom',
    signatory: 'receivedBy',
  },
  voucher: {
    number: 'voucherNumber',
    party: 'paidTo',
    signatory: 'approvedBy',
  },
};

const cleanText = (value) => typeof value === 'string' ? value.trim() : '';
const parseAmount = (value) => {
  if (value === undefined || value === null || value === '') return NaN;
  if (typeof value === 'string') return Number(value.replace(/[₹,\s]/g, ''));
  return Number(value);
};

module.exports = (kind) => (req, res, next) => {
  const config = configs[kind];
  const body = req.body || {};
  const errors = [];
  const date = new Date(body.date);
  const amount = parseAmount(body.amount);

  const payload = {
    [config.number]: cleanText(body[config.number]),
    date,
    [config.party]: cleanText(body[config.party]),
    purpose: cleanText(body.purpose),
    paymentMode: cleanText(body.paymentMode),
    amount,
    amountInWords: cleanText(body.amountInWords),
    [config.signatory]: cleanText(body[config.signatory]),
  };

  const requiredText = [
    [config.party, kind === 'receipt' ? 'Received from' : 'Paid to'],
    ['purpose', 'Purpose'],
    ['amountInWords', 'Amount in words'],
    [config.signatory, kind === 'receipt' ? 'Received by' : 'Approved by'],
  ];

  requiredText.forEach(([field, label]) => {
    if (!payload[field]) errors.push(`${label} is required`);
    else if (payload[field].length > 250) errors.push(`${label} must be 250 characters or fewer`);
  });

  if (Number.isNaN(date.getTime())) errors.push('A valid date is required');
  if (!PAYMENT_MODES.has(payload.paymentMode)) errors.push('A valid payment mode is required');
  if (!Number.isFinite(amount)) {
    errors.push('A valid amount is required');
  } else if (amount <= 0) {
    errors.push('Amount must be greater than zero');
  } else if (amount > 999999999.99) {
    errors.push('Amount must be 999999999.99 or less');
  }

  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  req.body = payload;
  next();
};
