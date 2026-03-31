const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');

// GET /api/admin/dashboard
router.get('/dashboard', auth, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingApprovals = await FarmerProfile.countDocuments({ verificationStatus: 'pending' });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    const revenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('customerId', 'name mobile')
      .populate('farmerId', 'name mobile')
      .sort({ createdAt: -1 })
      .limit(10);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalFarmers,
        totalCustomers,
        totalProducts,
        totalOrders,
        pendingApprovals,
        blockedUsers,
        totalRevenue: revenue[0]?.total || 0
      },
      recentOrders,
      ordersByStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role, blocked } = req.query;
    const filter = { role: { $ne: 'admin' } };
    if (role) filter.role = role;
    if (blocked === 'true') filter.isBlocked = true;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/farmers
router.get('/farmers', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const farmers = await User.find({ role: 'farmer' }).select('-password');
    const profiles = await FarmerProfile.find(
      status ? { verificationStatus: status } : {}
    );

    const result = farmers.map(farmer => {
      const profile = profiles.find(p => p.userId.toString() === farmer._id.toString());
      return { ...farmer.toObject(), profile };
    });

    if (status) {
      return res.json(result.filter(f => f.profile?.verificationStatus === status));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/farmers/:id/verify
router.put('/farmers/:id/verify', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const farmerId = req.params.id;

    console.log(`[ADMIN] verify farmer | id=${farmerId} | status=${status} | note=${note || 'none'}`);

    if (!farmerId || farmerId === 'null') {
      console.log(`[ADMIN] verify farmer | INVALID farmerId: ${farmerId}`);
      return res.status(400).json({ error: 'Invalid farmer ID' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      console.log(`[ADMIN] verify farmer | INVALID status: ${status}`);
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    // Verify the user exists first
    const farmerUser = await User.findById(farmerId);
    if (!farmerUser) {
      console.log(`[ADMIN] verify farmer | User NOT FOUND | id=${farmerId}`);
      return res.status(404).json({ error: 'Farmer user not found' });
    }

    // Update or create farmer profile
    const profile = await FarmerProfile.findOneAndUpdate(
      { userId: farmerId },
      { verificationStatus: status, verificationNote: note || '' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[ADMIN] verify farmer | Profile updated | verificationStatus=${profile.verificationStatus}`);

    // Update user status field as well
    const userUpdate = { status: status };
    if (status === 'approved') {
      userUpdate.isVerified = true;
    }
    await User.findByIdAndUpdate(farmerId, userUpdate);
    console.log(`[ADMIN] verify farmer | User status updated to ${status}`);

    res.json({ message: `Farmer ${status}`, profile });
  } catch (error) {
    console.error('[ADMIN] verify farmer ERROR:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/farmers/:id/status — Direct status update for farmer approval
router.patch('/farmers/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const farmerId = req.params.id;

    console.log(`[ADMIN] PATCH farmer status | id=${farmerId} | status=${status}`);

    if (!farmerId || farmerId === 'null') {
      console.log(`[ADMIN] PATCH farmer status | INVALID farmerId: ${farmerId}`);
      return res.status(400).json({ error: 'Invalid farmer ID' });
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      console.log(`[ADMIN] PATCH farmer status | INVALID status: ${status}`);
      return res.status(400).json({ error: 'Status must be pending, approved, or rejected' });
    }

    // Update user status
    const user = await User.findByIdAndUpdate(
      farmerId,
      { status: status, ...(status === 'approved' ? { isVerified: true } : {}) },
      { new: true }
    );

    if (!user) {
      console.log(`[ADMIN] PATCH farmer status | User NOT FOUND | id=${farmerId}`);
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Also update FarmerProfile verificationStatus
    await FarmerProfile.findOneAndUpdate(
      { userId: farmerId },
      { verificationStatus: status },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[ADMIN] PATCH farmer status | SUCCESS | user=${user.name || user.mobile} | status=${status}`);

    res.json({
      message: `Farmer status updated to ${status}`,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        status: user.status,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[ADMIN] PATCH farmer status ERROR:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot block admin' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders
router.get('/orders', auth, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name mobile')
      .populate('farmerId', 'name mobile')
      .populate('deliveryPartner')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/products
router.get('/products', auth, requireRole('admin'), async (req, res) => {
  try {
    const products = await Product.find()
      .populate('farmerId', 'name mobile')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/fraud-alerts
router.get('/fraud-alerts', auth, requireRole('admin'), async (req, res) => {
  try {
    // Detect suspicious patterns
    const alerts = [];

    // Users with many cancelled orders
    const cancelledByCustomer = await Order.aggregate([
      { $match: { status: 'cancelled' } },
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } }
    ]);

    for (const item of cancelledByCustomer) {
      const user = await User.findById(item._id).select('name mobile');
      if (user) {
        alerts.push({
          type: 'high_cancellations',
          severity: 'warning',
          message: `Customer ${user.name || user.mobile} has ${item.count} cancelled orders`,
          userId: user._id
        });
      }
    }

    // Farmers with many rejected orders
    const rejectedByFarmer = await Order.aggregate([
      { $match: { status: 'rejected' } },
      { $group: { _id: '$farmerId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } }
    ]);

    for (const item of rejectedByFarmer) {
      const user = await User.findById(item._id).select('name mobile');
      if (user) {
        alerts.push({
          type: 'high_rejections',
          severity: 'warning',
          message: `Farmer ${user.name || user.mobile} has rejected ${item.count} orders`,
          userId: user._id
        });
      }
    }

    // Unverified farmers with products
    const unverifiedWithProducts = await FarmerProfile.find({ verificationStatus: { $ne: 'approved' } });
    for (const farm of unverifiedWithProducts) {
      const productCount = await Product.countDocuments({ farmerId: farm.userId });
      if (productCount > 0) {
        const user = await User.findById(farm.userId).select('name mobile');
        if (user) {
          alerts.push({
            type: 'unverified_seller',
            severity: 'danger',
            message: `Unverified farmer ${user.name || user.mobile} has ${productCount} products listed`,
            userId: user._id
          });
        }
      }
    }

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
