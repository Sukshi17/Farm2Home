const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');

// GET /api/farmer/profile
router.get('/profile', auth, requireRole('farmer'), async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ userId: req.user._id });
    const user = req.user;
    res.json({
      user: { id: user._id, name: user.name, mobile: user.mobile, profileImage: user.profileImage, isVerified: user.isVerified },
      profile: profile || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/farmer/profile
router.put('/profile', auth, requireRole('farmer'), async (req, res) => {
  try {
    const { name, farmName, farmAddress, farmSize, cropTypes, upiId, location } = req.body;
    
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    const profile = await FarmerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { farmName, farmAddress, farmSize, cropTypes, upiId, location } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmer/profile/image
router.post('/profile/image', auth, requireRole('farmer'), (req, res, next) => {
  req.uploadSubDir = 'profiles';
  next();
}, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });
    res.json({ message: 'Profile image updated', imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmer/documents
router.post('/documents', auth, requireRole('farmer'), (req, res, next) => {
  req.uploadSubDir = 'documents';
  next();
}, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });
    const docUrl = `/uploads/documents/${req.file.filename}`;
    const docType = req.body.type || 'other';
    
    await FarmerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { documents: { type: docType, url: docUrl } }, $set: { verificationStatus: 'pending' } }
    );
    res.json({ message: 'Document uploaded successfully', url: docUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== PRODUCTS ===================

// GET /api/farmer/products
router.get('/products', auth, requireRole('farmer'), async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmer/products
router.post('/products', auth, requireRole('farmer'), (req, res, next) => {
  req.uploadSubDir = 'products';
  next();
}, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, unit, quantity, category } = req.body;
    
    if (!name || !price || !quantity) {
      return res.status(400).json({ error: 'Name, price, and quantity are required' });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    if (!image) {
      return res.status(400).json({ error: 'Product image is required' });
    }

    const product = new Product({
      farmerId: req.user._id,
      name,
      description: description || '',
      price: parseFloat(price),
      unit: unit || 'kg',
      quantity: parseInt(quantity),
      category: category || 'other',
      image
    });

    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/farmer/products/:id
router.put('/products/:id', auth, requireRole('farmer'), (req, res, next) => {
  req.uploadSubDir = 'products';
  next();
}, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/products/${req.file.filename}`;
    }
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.quantity) updates.quantity = parseInt(updates.quantity);

    Object.assign(product, updates);
    await product.save();
    res.json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/farmer/products/:id
router.delete('/products/:id', auth, requireRole('farmer'), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, farmerId: req.user._id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== ORDERS ===================

// GET /api/farmer/orders
router.get('/orders', auth, requireRole('farmer'), async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.user._id })
      .populate('deliveryPartner')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/farmer/orders/:id/status
router.put('/orders/:id/status', auth, requireRole('farmer'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'rejected', 'assigned', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    
    // Auto-assign delivery partner if accepted and delivery type is farmer_delivery
    if (status === 'accepted' && order.deliveryType === 'farmer_delivery') {
      const availablePartner = await DeliveryPartner.findOne({ 
        farmerId: req.user._id, 
        isAvailable: true 
      });
      if (availablePartner) {
        order.deliveryPartner = availablePartner._id;
        order.status = 'assigned';
      }
    }

    await order.save();
    const populated = await Order.findById(order._id).populate('deliveryPartner');
    res.json({ message: 'Order status updated', order: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/farmer/orders/:id/assign-partner
router.put('/orders/:id/assign-partner', auth, requireRole('farmer'), async (req, res) => {
  try {
    const { partnerId } = req.body;
    const order = await Order.findOne({ _id: req.params.id, farmerId: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.deliveryPartner = partnerId;
    order.status = 'assigned';
    await order.save();

    const populated = await Order.findById(order._id).populate('deliveryPartner');
    res.json({ message: 'Delivery partner assigned', order: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== DELIVERY PARTNERS ===================

// GET /api/farmer/delivery-partners
router.get('/delivery-partners', auth, requireRole('farmer'), async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({ farmerId: req.user._id });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/farmer/delivery-partners
router.post('/delivery-partners', auth, requireRole('farmer'), async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    const partner = new DeliveryPartner({
      farmerId: req.user._id,
      name,
      phone,
      location: location || {}
    });
    await partner.save();
    res.status(201).json({ message: 'Delivery partner added', partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/farmer/delivery-partners/:id
router.delete('/delivery-partners/:id', auth, requireRole('farmer'), async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOneAndDelete({ _id: req.params.id, farmerId: req.user._id });
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json({ message: 'Partner removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/farmer/dashboard
router.get('/dashboard', auth, requireRole('farmer'), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ farmerId: req.user._id });
    const totalOrders = await Order.countDocuments({ farmerId: req.user._id });
    const pendingOrders = await Order.countDocuments({ farmerId: req.user._id, status: 'placed' });
    const deliveredOrders = await Order.countDocuments({ farmerId: req.user._id, status: 'delivered' });
    
    const earnings = await Order.aggregate([
      { $match: { farmerId: req.user._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const lowStock = await Product.find({ farmerId: req.user._id, quantity: { $lte: 5 }, isAvailable: true });
    const recentOrders = await Order.find({ farmerId: req.user._id }).sort({ createdAt: -1 }).limit(5);
    const profile = await FarmerProfile.findOne({ userId: req.user._id });

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalEarnings: earnings[0]?.total || 0
      },
      lowStock,
      recentOrders,
      verificationStatus: profile?.verificationStatus || 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
