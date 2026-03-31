const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2home';

const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  role: { type: String, enum: ['farmer', 'customer', 'admin'], required: true },
  profileImage: { type: String, default: '' },
  isVerified: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  password: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove old admin with wrong format if exists
    await User.deleteMany({ role: 'admin' });
    console.log('Cleared existing admin users');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      mobile: '+919999999999',
      name: 'Admin',
      role: 'admin',
      isVerified: true,
      password: hashedPassword
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Mobile: 9999999999 (stored as +919999999999)');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
