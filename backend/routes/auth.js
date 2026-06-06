const express = require('express');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { validateRegistration, validateLogin } = require('../middleware/inputValidation');
const { authLimiter, loginBruteGuard, onLoginFailure, onLoginSuccess } = require('../middleware/rateLimiter');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
};

// POST /api/auth/register
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const { fullName, idNumber, accountNumber, password } = req.body;

    const existing = await Customer.findOne({
      $or: [{ idNumber }, { accountNumber }]
    });
    if (existing) {
      return res.status(409).json({ message: 'Account already exists.' });
    }

    const customer = new Customer({ fullName, idNumber, accountNumber, password });
    await customer.save();
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, loginBruteGuard, async (req, res) => {
  try {
    const { accountNumber, password } = req.body;

    const customer = await Customer.findOne({ accountNumber });
    if (!customer || !(await customer.comparePassword(password))) {
      await onLoginFailure(req.ip);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    await onLoginSuccess(req.ip);

    const token = jwt.sign(
      { id: customer._id, accountNumber: customer.accountNumber, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      message: 'Login successful.',
      fullName: customer.fullName,
      accountNumber: customer.accountNumber
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ message: 'Logged out.' });
});

module.exports = router;
