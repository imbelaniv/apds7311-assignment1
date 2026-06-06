// input validation patterns
export const PATTERNS = {
  fullName:      /^[a-zA-Z\s]{2,100}$/,
  idNumber:      /^\d{13}$/,
  accountNumber: /^\d{10,12}$/,
  password:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username:      /^[a-zA-Z0-9_]{3,30}$/,
  amount:        /^\d+(\.\d{1,2})?$/,
  swiftCode:     /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  currency:      /^[A-Z]{3}$/
};

export const ERROR_MESSAGES = {
  fullName:      'Full name must be 2–100 letters and spaces only.',
  idNumber:      'ID number must be exactly 13 digits.',
  accountNumber: 'Account number must be 10–12 digits.',
  password:      'Password must be 8+ characters with uppercase, lowercase, digit, and special character (@$!%*?&).',
  username:      'Username must be 3–30 alphanumeric characters or underscores.',
  amount:        'Amount must be a positive number with up to 2 decimal places.',
  swiftCode:     'SWIFT code must be 8 or 11 uppercase letters/digits (e.g. ABCDEF12 or ABCDEF12XXX).',
  currency:      'Currency must be a 3-letter ISO code (e.g. USD, ZAR, EUR).'
};

export const validate = (name, value) => {
  if (!PATTERNS[name]) return '';
  return PATTERNS[name].test(String(value)) ? '' : ERROR_MESSAGES[name];
};
