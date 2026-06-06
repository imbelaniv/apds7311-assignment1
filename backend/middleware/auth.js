const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const verifyEmployee = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied. Employees only.' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyEmployee };
