const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer:             { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerAccountNumber: { type: String, required: true },
  amount:               { type: Number, required: true, min: 0.01 },
  currency:             { type: String, required: true, uppercase: true },
  provider:             { type: String, required: true, default: 'SWIFT' },
  recipientAccount:     { type: String, required: true },
  swiftCode:            { type: String, required: true, uppercase: true },
  status: {
    type: String,
    enum: ['pending', 'verified', 'submitted'],
    default: 'pending'
  },
  verifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
