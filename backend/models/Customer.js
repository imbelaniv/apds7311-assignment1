const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  fullName:      { type: String, required: true, trim: true },
  idNumber:      { type: String, required: true, unique: true },
  accountNumber: { type: String, required: true, unique: true },
  password:      { type: String, required: true }
}, { timestamps: true });

// hash before saving
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
