const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  voucherNumber: { type: String, required: true, unique: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  paidTo: { type: String, required: true, trim: true },
  purpose: { type: String, required: true, trim: true },
  paymentMode: { type: String, enum: ['Cash','UPI','Bank Transfer','Cheque','NEFT','RTGS','IMPS','Card','Other'], required: true },
  amount: { type: Number, required: true, min: 0.01, max: 999999999.99 },
  amountInWords: { type: String, required: true },
  approvedBy: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('PaymentVoucher', schema);
