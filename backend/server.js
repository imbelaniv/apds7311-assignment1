require('dotenv').config();
const https = require('https');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const employeeRoutes = require('./routes/employee');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:'],
      frameAncestors: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

const allowedOrigins = [
  process.env.CUSTOMER_ORIGIN,
  process.env.EMPLOYEE_ORIGIN
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());

app.use(generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employee', employeeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

if (require.main === module) {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 3001;
      try {
        const sslOptions = {
          key:  fs.readFileSync('./ssl/server.key'),
          cert: fs.readFileSync('./ssl/server.cert')
        };
        https.createServer(sslOptions, app).listen(PORT, () =>
          console.log(`Secure HTTPS server running on https://localhost:${PORT}`)
        );
      } catch {
        console.warn('SSL certs not found — falling back to HTTP');
        app.listen(PORT, () =>
          console.log(`HTTP server running on http://localhost:${PORT}`)
        );
      }
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}

module.exports = app;
