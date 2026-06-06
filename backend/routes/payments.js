const express = require('express');
const Transaction = require('../models/Transaction');
const { verifyToken } = require('../middleware/auth');
const { validatePayment } = require('../middleware/inputValidation');

const router = express.Router();

// POST /api/payments — submit a new international payment
router.post('/', verifyToken, validatePayment, async (req, res) => {
  try {
    const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

    const transaction = new Transaction({
      customer:             req.user.id,
      customerAccountNumber: req.user.accountNumber,
      amount:               parseFloat(amount),
      currency:             currency.toUpperCase(),
      provider,
      recipientAccount,
      swiftCode:            swiftCode.toUpperCase(),
      status:               'pending'
    });

    await transaction.save();
    res.status(201).json({ message: 'Payment submitted successfully.', transaction });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/payments — retrieve current customer's transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction
      .find({ customer: req.user.id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
