const mongoose = require('mongoose');

const netBalanceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['credit', 'debit'], required: true, default: 'credit' },
  note: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Optional link to originating transaction (receipt / voucher / manual)
  transactionType: { type: String, enum: ['receipt', 'voucher', 'manual'], default: 'manual' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  // Audit fields: previous and updated net balance after applying this entry
  previousBalance: { type: Number, required: true },
  updatedBalance: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('NetBalance', netBalanceSchema);