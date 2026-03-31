const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const CustomerProfile = require('../models/CustomerProfile');
const { verifyFirebaseToken } = require('../config/firebase');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Normalize mobile number to +91XXXXXXXXXX format
const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  // Remove all non-digit characters
  let digits = mobile.replace(/\D/g, '');
  // If starts with 91 and is 12 digits, strip the 91 prefix
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  // Must be exactly 10 digits now
  if (digits.length !== 10) return null;
  return `+91${digits}`;
};

// POST /api/auth/check-mobile - Check if mobile exists (used before OTP)
router.post('/check-mobile', async (req, res) => {
  try {
    const { mobile, action } = req.body; // action: 'register' or 'login'
    const normalizedMobile = normalizeMobile(mobile);

    console.log(`[AUTH] check-mobile called | action=${action} | raw=${mobile} | normalized=${normalizedMobile}`);

    if (!normalizedMobile) {
      return res.status(400).json({ error: 'Invalid mobile number. Must be 10 digits.' });
    }

    const existingUser = await User.findOne({ mobile: normalizedMobile });
    console.log(`[AUTH] check-mobile | user found: ${!!existingUser} | mobile: ${normalizedMobile}`);

    if (action === 'register') {
      // For registration: check if a FULLY registered user exists
      if (existingUser && existingUser.isProfileComplete) {
        return res.status(400).json({ error: 'This mobile number is already registered. Please login instead.' });
      }
      // Allow registration if user doesn't exist OR exists but profile is incomplete
      return res.json({ exists: false, message: 'Mobile number is available for registration.' });
    } else if (action === 'login') {
      // For login: mobile MUST exist with complete profile
      if (!existingUser) {
        return res.status(404).json({ error: 'No account found with this mobile number. Please register first.' });
      }
      if (existingUser.isBlocked) {
        return res.status(403).json({ error: 'Your account has been blocked by admin.' });
      }
      return res.json({
        exists: true,
        role: existingUser.role,
        isProfileComplete: existingUser.isProfileComplete,
        message: 'Account found. Proceed to OTP verification.'
      });
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be "register" or "login".' });
    }
  } catch (error) {
    console.error('[AUTH] check-mobile error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/verify-otp
// Creates a MINIMAL user record after OTP verification (if not already existing)
// This is step 1 of the 2-step registration flow
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, role, firebaseToken } = req.body;
    const normalizedMobile = normalizeMobile(mobile);

    console.log(`[AUTH] verify-otp called | raw=${mobile} | normalized=${normalizedMobile} | role=${role}`);

    if (!normalizedMobile) {
      return res.status(400).json({ error: 'Invalid mobile number format.' });
    }

    if (!role || !['farmer', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be farmer or customer.' });
    }

    // Verify Firebase token if provided (production mode)
    if (firebaseToken) {
      const decoded = await verifyFirebaseToken(firebaseToken);
      if (!decoded) {
        console.log(`[AUTH] verify-otp | Firebase token verification FAILED`);
        return res.status(401).json({ error: 'OTP verification failed.' });
      }
      console.log(`[AUTH] verify-otp | Firebase token verified successfully`);
    } else {
      console.log(`[AUTH] verify-otp | Dev mode — skipping Firebase token verification`);
    }

    // Check if user already exists
    let user = await User.findOne({ mobile: normalizedMobile });

    if (user) {
      // User already exists — if profile is complete, they should login instead
      if (user.isProfileComplete) {
        console.log(`[AUTH] verify-otp | User already fully registered | mobile=${normalizedMobile}`);
        return res.status(400).json({ error: 'This mobile number is already registered. Please login instead.' });
      }
      // User exists but profile incomplete — update verification status
      user.isVerified = true;
      user.role = role;
      await user.save();
      console.log(`[AUTH] verify-otp | Updated existing incomplete user | id=${user._id}`);
    } else {
      // Create a MINIMAL user record — no name yet, profile not complete
      user = new User({
        mobile: normalizedMobile,
        role,
        isVerified: true,
        isProfileComplete: false,
        status: 'pending'
      });
      await user.save();
      console.log(`[AUTH] verify-otp | Created minimal user | id=${user._id} | mobile=${user.mobile} | role=${user.role}`);
    }

    // Create role-specific profile if it doesn't exist yet
    if (role === 'farmer') {
      const existingProfile = await FarmerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await FarmerProfile.create({ userId: user._id });
        console.log(`[AUTH] verify-otp | FarmerProfile created for user ${user._id}`);
      }
    } else {
      const existingProfile = await CustomerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await CustomerProfile.create({ userId: user._id });
        console.log(`[AUTH] verify-otp | CustomerProfile created for user ${user._id}`);
      }
    }

    res.json({
      message: 'OTP verified successfully',
      mobile: normalizedMobile,
      userId: user._id,
      role: user.role,
      isProfileComplete: user.isProfileComplete
    });
  } catch (error) {
    console.error('[AUTH] verify-otp error:', error.message, error.stack);
    if (error.code === 11000) {
      // Duplicate key — user was created between our check and insert, just fetch and return
      const user = await User.findOne({ mobile: normalizeMobile(req.body.mobile) });
      if (user) {
        return res.json({
          message: 'OTP verified successfully',
          mobile: user.mobile,
          userId: user._id,
          role: user.role,
          isProfileComplete: user.isProfileComplete
        });
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/complete-profile
// Updates existing user with name — does NOT create a new user
// This is step 2 of the 2-step registration flow
router.post('/complete-profile', async (req, res) => {
  try {
    const { mobile, name } = req.body;
    const normalizedMobile = normalizeMobile(mobile);

    console.log(`[AUTH] complete-profile called | raw=${mobile} | normalized=${normalizedMobile} | name=${name}`);

    if (!normalizedMobile) {
      return res.status(400).json({ error: 'Invalid mobile number format.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    // UPDATE existing user — do NOT insert a new one
    const user = await User.findOneAndUpdate(
      { mobile: normalizedMobile },
      {
        name: name.trim(),
        isProfileComplete: true
      },
      { new: true }
    );

    if (!user) {
      console.log(`[AUTH] complete-profile | No user found for mobile=${normalizedMobile}`);
      return res.status(404).json({ error: 'User not found. Please verify OTP first.' });
    }

    console.log(`[AUTH] complete-profile | User UPDATED | id=${user._id} | name=${user.name} | isProfileComplete=${user.isProfileComplete}`);

    // Generate token and respond
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[AUTH] complete-profile error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register (BACKWARD COMPATIBLE — kept for any legacy calls)
// Now uses upsert logic instead of strict insert
router.post('/register', async (req, res) => {
  try {
    const { mobile, name, role, firebaseToken } = req.body;
    const normalizedMobile = normalizeMobile(mobile);

    console.log(`[AUTH] register called | raw=${mobile} | normalized=${normalizedMobile} | name=${name} | role=${role}`);

    if (!normalizedMobile) {
      return res.status(400).json({ error: 'Invalid mobile number format.' });
    }

    if (!role || !['farmer', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be farmer or customer.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    // Verify Firebase token if provided
    if (firebaseToken) {
      const decoded = await verifyFirebaseToken(firebaseToken);
      if (!decoded) {
        console.log(`[AUTH] register | Firebase token verification FAILED`);
        return res.status(401).json({ error: 'OTP verification failed.' });
      }
      console.log(`[AUTH] register | Firebase token verified successfully`);
    } else {
      console.log(`[AUTH] register | Dev mode — skipping Firebase token verification`);
    }

    // USE UPSERT: Update if exists, create if not — prevents "mobile already exists" error
    const user = await User.findOneAndUpdate(
      { mobile: normalizedMobile },
      {
        $set: {
          name: name.trim(),
          role,
          isVerified: true,
          isProfileComplete: true,
          status: 'pending'
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[AUTH] register | User UPSERTED | id=${user._id} | mobile=${user.mobile} | role=${user.role}`);

    // Create role-specific profile if it doesn't exist
    if (role === 'farmer') {
      const existingProfile = await FarmerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await FarmerProfile.create({ userId: user._id });
        console.log(`[AUTH] register | FarmerProfile created for user ${user._id}`);
      }
    } else {
      const existingProfile = await CustomerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await CustomerProfile.create({ userId: user._id });
        console.log(`[AUTH] register | CustomerProfile created for user ${user._id}`);
      }
    }

    // Generate token and respond
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[AUTH] register error:', error.message, error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Mobile number already registered (duplicate key).' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
// Called ONLY after OTP verification success on the frontend
router.post('/login', async (req, res) => {
  try {
    const { mobile, firebaseToken, password } = req.body;
    const normalizedMobile = normalizeMobile(mobile);

    console.log(`[AUTH] login called | raw=${mobile} | normalized=${normalizedMobile}`);

    if (!normalizedMobile) {
      return res.status(400).json({ error: 'Invalid mobile number format.' });
    }

    // STEP 1: Find user
    const user = await User.findOne({ mobile: normalizedMobile });
    console.log(`[AUTH] login | user found: ${!!user} | mobile: ${normalizedMobile}`);

    if (!user) {
      return res.status(404).json({ error: 'No account found with this mobile number. Please register first.' });
    }

    if (user.isBlocked) {
      console.log(`[AUTH] login | user is BLOCKED | mobile: ${normalizedMobile}`);
      return res.status(403).json({ error: 'Your account has been blocked.' });
    }

    // STEP 2: Verify credentials
    if (user.role === 'admin') {
      // Admin login with password
      if (!password) {
        return res.status(400).json({ error: 'Password required for admin login.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`[AUTH] login | admin password MISMATCH`);
        return res.status(401).json({ error: 'Invalid password.' });
      }
      console.log(`[AUTH] login | admin password verified`);
    } else {
      // Firebase token verification for non-admin users
      if (firebaseToken) {
        const decoded = await verifyFirebaseToken(firebaseToken);
        if (!decoded) {
          console.log(`[AUTH] login | Firebase token verification FAILED`);
          return res.status(401).json({ error: 'OTP verification failed.' });
        }
        console.log(`[AUTH] login | Firebase token verified`);
      } else {
        console.log(`[AUTH] login | Dev mode — skipping Firebase token verification`);
      }
    }

    // STEP 3: Generate token and respond
    const token = generateToken(user._id);
    console.log(`[AUTH] login | SUCCESS | id=${user._id} | mobile=${user.mobile} | role=${user.role}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        status: user.status,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('[AUTH] login error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/verify-token - verify JWT is still valid
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        status: user.status,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('[AUTH] verify-token error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
