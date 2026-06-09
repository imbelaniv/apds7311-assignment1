# APDS7311 - International Payments Portal

A secure full-stack MERN banking application with two portals: a customer-facing portal for registration and international payment submission, and an employee portal for verifying and forwarding transactions to SWIFT.

Built for the Application Development Security module (APDS7311/w) at The Independent Institute of Education.

---

## Tech Stack

- **Backend** - Node.js, Express, MongoDB (Mongoose), JWT authentication
- **Customer Portal** - React 18, Vite 5
- **Employee Portal** - React 18, Vite 5
- **Database** - MongoDB Atlas
- **CI/CD** - CircleCI + SonarCloud

---

## Security Features

- Passwords hashed with bcrypt (saltRounds=12)
- JWT stored in HttpOnly, Secure, SameSite=Strict cookies
- Full HTTPS on all three services (self-signed cert on backend, Vite SSL plugin on frontends)
- Input whitelisting via RegEx on both client and server
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting on all routes and brute-force protection on login (5 attempts, 1hr lockout)
- NoSQL injection protection via express-mongo-sanitize
- XSS protection via xss-clean and React JSX auto-escaping
- CORS restricted to portal origins only

---

## Prerequisites

- Node.js v18 or higher
- A MongoDB Atlas cluster (or local MongoDB)
- OpenSSL (for generating the SSL certificate)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/imbelaniv/apds7311-assignment1.git
cd apds7311-assignment1
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Generate SSL certificate

```bash
mkdir -p backend/ssl
openssl req -x509 -newkey rsa:4096 -keyout backend/ssl/server.key -out backend/ssl/server.cert -days 365 -nodes -subj "/CN=localhost"
```

### 4. Configure environment variables

Create `backend/.env`:

```
PORT=3001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
CUSTOMER_ORIGIN=https://localhost:5173
EMPLOYEE_ORIGIN=https://localhost:5174
NODE_ENV=development
```

### 5. Seed employee accounts

```bash
npm run seed
```

This creates three pre-registered employee accounts:

| Username | Password |
|----------|----------|
| emp_john | BankSecure@123 |
| emp_sarah | BankSecure@456 |
| emp_mike | BankSecure@789 |

---

## Running the App

Start all three services from the root directory:

```bash
npm run dev
```

This starts:
- Backend API at `https://localhost:3001`
- Customer portal at `https://localhost:5173`
- Employee portal at `https://localhost:5174`

> The browser will show a security warning for the self-signed certificate. Click "Advanced" and proceed to accept it.

---

## Running Tests

```bash
npm test
```

Runs 21 Jest API tests against an in-memory MongoDB instance. No external database connection needed.

---

## Application Flow

**Customer:**
1. Register at `https://localhost:5173/register`
2. Log in with account number and password
3. Submit an international payment (amount, currency, recipient account, SWIFT code)
4. View payment status in the recent payments list

**Employee:**
1. Log in at `https://localhost:5174` with a seeded employee account
2. View pending transactions on the dashboard
3. Verify a transaction after checking the payee details
4. Click Submit to SWIFT to finalise all verified transactions

---

## Project Structure

```
apds7311-assignment1/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── middleware/       # Auth, rate limiting, input validation
│   ├── models/          # Customer, Employee, Transaction schemas
│   ├── routes/          # Auth, payments, employee routes
│   ├── scripts/         # Employee seed script
│   ├── ssl/             # SSL cert and key (gitignored)
│   └── tests/           # Jest API tests
├── frontend/            # Customer portal (React + Vite)
├── employee-portal/     # Employee portal (React + Vite)
├── .circleci/           # CircleCI pipeline config
└── sonar-project.properties
```

---

## CI/CD Pipeline

Every push to `main` triggers a two-job CircleCI pipeline:

1. **test-and-audit** - runs Jest tests and npm audit for dependency vulnerabilities
2. **sonar-scan** - runs SonarCloud static analysis across backend and frontend source

---

## License

This project is submitted as academic coursework and is not licensed for commercial use.
