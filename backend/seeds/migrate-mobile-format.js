/**
 * Migration script to normalize existing mobile numbers to +91XXXXXXXXXX format
 * and re-seed the admin user.
 * 
 * Run: node seeds/migrate-mobile-format.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm2home';

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Step 1: Find all users with mobile numbers that don't start with +91
    const usersToFix = await usersCollection.find({
      mobile: { $not: /^\+91/ }
    }).toArray();

    console.log(`Found ${usersToFix.length} users with non-normalized mobile numbers`);

    for (const user of usersToFix) {
      let digits = user.mobile.replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.slice(2);
      }
      if (digits.length === 10) {
        const normalized = `+91${digits}`;
        
        // Check if normalized number already exists (to avoid duplicate key errors)
        const existing = await usersCollection.findOne({ mobile: normalized });
        if (existing && existing._id.toString() !== user._id.toString()) {
          console.log(`  SKIP: ${user.mobile} -> ${normalized} (would create duplicate, deleting old record)`);
          await usersCollection.deleteOne({ _id: user._id });
        } else {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { mobile: normalized } }
          );
          console.log(`  FIXED: ${user.mobile} -> ${normalized} (${user.role})`);
        }
      } else {
        console.log(`  WARN: Cannot normalize mobile "${user.mobile}" for user ${user._id}`);
      }
    }

    // Step 2: Ensure admin exists with correct format
    let admin = await usersCollection.findOne({ role: 'admin' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await usersCollection.insertOne({
        mobile: '+919999999999',
        name: 'Admin',
        role: 'admin',
        profileImage: '',
        isVerified: true,
        isBlocked: false,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('\nAdmin user created: +919999999999 / admin123');
    } else {
      console.log(`\nAdmin already exists: ${admin.mobile}`);
    }

    // Step 3: Drop and recreate unique index on mobile
    try {
      await usersCollection.dropIndex('mobile_1');
      console.log('Dropped old mobile index');
    } catch (e) {
      // Index might not exist
    }
    await usersCollection.createIndex({ mobile: 1 }, { unique: true });
    console.log('Created unique index on mobile field');

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
