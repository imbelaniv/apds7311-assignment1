const express = require('express');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Transaction = require('../models/Transaction');
const { verifyEmployee } = require('../middleware/auth');
const { validateEmployeeLogin } = require('../middleware/inputValidation');
const { authLimiter, loginBruteGuard, onLoginFailure, onLoginSuccess } = require('../middleware/rateLimiter');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
};

// POST /api/employee/login
router.post('/login', authLimiter, validateEmployeeLogin, loginBruteGuard, async (req, res) => {
  try {
    const { username, password } = req.body;

    const employee = await Employee.findOne({ username });
    if (!employee || !(await employee.comparePassword(password))) {
      await onLoginFailure(req.ip);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    await onLoginSuccess(req.ip);

    const token = jwt.sign(
      { id: employee._id, username: employee.username, role: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ message: 'Login successful.', username: employee.username });
  } catch (err) {
    console.error('Employee login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/employee/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ message: 'Logged out.' });
});

// GET /api/employee/transactions — view pending + verified transactions
router.get('/transactions', verifyEmployee, async (req, res) => {
  try {
    const transactions = await Transaction
      .find({ status: { $in: ['pending', 'verified'] } })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/employee/transactions/:id/verify — verify a transaction
router.patch('/transactions/:id/verify', verifyEmployee, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: 'verified', verifiedBy: req.user.id },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction verified.', transaction });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/employee/transactions/submit-swift — submit all verified transactions to SWIFT
router.post('/transactions/submit-swift', verifyEmployee, async (req, res) => {
  try {
    const result = await Transaction.updateMany(
      { status: 'verified' },
      { status: 'submitted', submittedAt: new Date() }
    );
    res.json({ message: `${result.modifiedCount} transaction(s) submitted to SWIFT.` });
  } catch (err) {
    console.error('Submit SWIFT error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
