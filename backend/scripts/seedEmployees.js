require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

// Pre-configured employee accounts — no registration endpoint exists for employees
const EMPLOYEES = [
  { username: 'emp_john',  password: 'BankSecure@123' },
  { username: 'emp_sarah', password: 'BankSecure@456' },
  { username: 'emp_mike',  password: 'BankSecure@789' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const emp of EMPLOYEES) {
    const exists = await Employee.findOne({ username: emp.username });
    if (!exists) {
      await Employee.create(emp);
      console.log(`Created: ${emp.username}`);
    } else {
      console.log(`Already exists: ${emp.username}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
