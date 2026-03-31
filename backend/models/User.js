const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+91\d{10}$/, 'Mobile number must be in +91XXXXXXXXXX format']
  },
  name: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['farmer', 'customer', 'admin'],
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: 'pending'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
