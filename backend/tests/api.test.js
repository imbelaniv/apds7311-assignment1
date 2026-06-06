const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret_key_for_ci_only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CUSTOMER_ORIGIN = 'http://localhost:5173';
process.env.EMPLOYEE_ORIGIN = 'http://localhost:5174';

const app = require('../server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod.stop();
}, 30000);

describe('GET /api/health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  const valid = {
    fullName:      'John Doe',
    idNumber:      '0001014800086',
    accountNumber: '1234567890',
    password:      'SecurePass@1'
  };

  it('rejects a 3-digit ID number', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...valid, idNumber: '123' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a weak password (no special character)', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...valid, password: 'Weakpass1' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a name containing numbers', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...valid, fullName: 'John123' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a password that is all lowercase', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...valid, password: 'alllowercase1@' });
    expect(res.statusCode).toBe(400);
  });

  it('registers a valid customer', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Registration successful.');
  });

  it('prevents duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ accountNumber: '1234567890', password: 'WrongPass@1' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-existent account', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ accountNumber: '9999999999', password: 'SecurePass@1' });
    expect(res.statusCode).toBe(401);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ accountNumber: '1234567890', password: 'SecurePass@1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful.');
    expect(res.body.password).toBeUndefined();
  });
});

describe('Input validation', () => {
  const { PATTERNS } = require('../middleware/inputValidation');

  it('accepts valid SWIFT codes (8 and 11 characters)', () => {
    expect(PATTERNS.swiftCode.test('ABCDEF12')).toBe(true);
    expect(PATTERNS.swiftCode.test('ABCDEF12XXX')).toBe(true);
  });

  it('rejects invalid SWIFT codes', () => {
    expect(PATTERNS.swiftCode.test('INVALID')).toBe(false);
    expect(PATTERNS.swiftCode.test('abc12345')).toBe(false);
    expect(PATTERNS.swiftCode.test('ABCDEF123456')).toBe(false);
  });

  it('accepts valid SA ID numbers (13 digits)', () => {
    expect(PATTERNS.idNumber.test('0001014800086')).toBe(true);
  });

  it('rejects invalid SA ID numbers', () => {
    expect(PATTERNS.idNumber.test('123')).toBe(false);
    expect(PATTERNS.idNumber.test('00010148000861')).toBe(false);
    expect(PATTERNS.idNumber.test('000101480008A')).toBe(false);
  });

  it('accepts valid amounts (up to 2 decimal places)', () => {
    expect(PATTERNS.amount.test('100')).toBe(true);
    expect(PATTERNS.amount.test('100.50')).toBe(true);
    expect(PATTERNS.amount.test('0.99')).toBe(true);
  });

  it('rejects invalid amounts', () => {
    expect(PATTERNS.amount.test('100.555')).toBe(false);
    expect(PATTERNS.amount.test('-50')).toBe(false);
    expect(PATTERNS.amount.test('abc')).toBe(false);
  });

  it('accepts valid 3-letter currency codes', () => {
    expect(PATTERNS.currency.test('USD')).toBe(true);
    expect(PATTERNS.currency.test('ZAR')).toBe(true);
    expect(PATTERNS.currency.test('EUR')).toBe(true);
  });

  it('rejects invalid currency codes', () => {
    expect(PATTERNS.currency.test('us')).toBe(false);
    expect(PATTERNS.currency.test('USDT')).toBe(false);
    expect(PATTERNS.currency.test('123')).toBe(false);
  });
});

describe('Protected routes', () => {
  it('rejects payment submission without a token', async () => {
    const res = await request(app).post('/api/payments').send({
      amount: '100', currency: 'USD', provider: 'SWIFT',
      recipientAccount: '1234567891', swiftCode: 'ABCDEF12'
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects employee transaction fetch without a token', async () => {
    const res = await request(app).get('/api/employee/transactions');
    expect(res.statusCode).toBe(401);
  });

  it('rejects employee verify without a token', async () => {
    const res = await request(app).patch('/api/employee/transactions/507f1f77bcf86cd799439011/verify');
    expect(res.statusCode).toBe(401);
  });
});
