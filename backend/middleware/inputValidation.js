// Server-side RegEx whitelisting — mirrors the patterns enforced on the client
const PATTERNS = {
  fullName:      /^[a-zA-Z\s]{2,100}$/,
  idNumber:      /^\d{13}$/,
  accountNumber: /^\d{10,12}$/,
  password:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username:      /^[a-zA-Z0-9_]{3,30}$/,
  amount:        /^\d+(\.\d{1,2})?$/,
  swiftCode:     /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  currency:      /^[A-Z]{3}$/,
  provider:      /^(SWIFT)$/
};

const validateFields = (fields) => (req, res, next) => {
  for (const [field, pattern] of Object.entries(fields)) {
    const value = req.body[field];
    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ message: `${field} is required.` });
    }
    if (!pattern.test(String(value))) {
      return res.status(400).json({ message: `Invalid ${field} format.` });
    }
  }
  next();
};

const validateRegistration = validateFields({
  fullName:      PATTERNS.fullName,
  idNumber:      PATTERNS.idNumber,
  accountNumber: PATTERNS.accountNumber,
  password:      PATTERNS.password
});

const validateLogin = validateFields({
  accountNumber: PATTERNS.accountNumber,
  password:      PATTERNS.password
});

const validateEmployeeLogin = validateFields({
  username: PATTERNS.username,
  password: PATTERNS.password
});

const validatePayment = validateFields({
  amount:          PATTERNS.amount,
  currency:        PATTERNS.currency,
  provider:        PATTERNS.provider,
  recipientAccount: PATTERNS.accountNumber,
  swiftCode:       PATTERNS.swiftCode
});

module.exports = {
  PATTERNS,
  validateRegistration,
  validateLogin,
  validateEmployeeLogin,
  validatePayment
};
