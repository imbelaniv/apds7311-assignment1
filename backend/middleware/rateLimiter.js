const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' }
});

// track failed logins per IP — 5 attempts triggers a 1-hour block
const _bruteForce = new RateLimiterMemory({
  points: 5,
  duration: 60 * 60,
  blockDuration: 60 * 60
});

const onLoginFailure = async (ip) => {
  try {
    await _bruteForce.consume(ip);
  } catch {
    // already blocked
  }
};

const onLoginSuccess = async (ip) => {
  try {
    await _bruteForce.delete(ip);
  } catch {
    // ignore
  }
};

const loginBruteGuard = async (req, res, next) => {
  try {
    const info = await _bruteForce.get(req.ip);
    if (info && info.consumedPoints >= 5) {
      const secs = Math.round(info.msBeforeNext / 1000) || 1;
      return res.status(429).json({
        message: `Too many failed login attempts. Try again in ${secs} second(s).`
      });
    }
    next();
  } catch {
    next();
  }
};

module.exports = { generalLimiter, authLimiter, loginBruteGuard, onLoginFailure, onLoginSuccess };
