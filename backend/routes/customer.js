const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
const Review = require('../models/Review');

// GET /api/customer/profile
router.get('/profile', auth, requireRole('customer'), async (req, res) => {
  try {
    const profile = await CustomerProfile.findOne({ userId: req.user._id });
    res.json({
      user: { id: req.user._id, name: req.user.name, mobile: req.user.mobile, profileImage: req.user.profileImage },
      profile: profile || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customer/profile
router.put('/profile', auth, requireRole('customer'), async (req, res) => {
  try {
    const { name, address, city, state, pincode, location } = req.body;
    if (name) await User.findByIdAndUpdate(req.user._id, { name });
    
    const profile = await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { address, city, state, pincode, location } },
      { new: true, upsert: true }
    );
    res.json({ message: 'Profile updated', profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customer/profile/image
router.post('/profile/image', auth, requireRole('customer'), (req, res, next) => {
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

// =================== PRODUCTS ===================

// GET /api/customer/products - browse all available products
router.get('/products', auth, requireRole('customer'), async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    const filter = { isAvailable: true, quantity: { $gt: 0 } };

    if (category && category !== 'all') filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    if (search) filter.name = { $regex: search, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_low') sortOption = { price: 1 };
    if (sort === 'price_high') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const products = await Product.find(filter).sort(sortOption).populate('farmerId', 'name mobile');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer/products/:id
router.get('/products/:id', auth, requireRole('customer'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmerId', 'name mobile');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const farmerProfile = await FarmerProfile.findOne({ userId: product.farmerId._id });
    const reviews = await Review.find({ productId: product._id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ product, farmerProfile, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== WISHLIST ===================

// GET /api/customer/wishlist
router.get('/wishlist', auth, requireRole('customer'), async (req, res) => {
  try {
    const profile = await CustomerProfile.findOne({ userId: req.user._id }).populate('wishlist');
    res.json(profile?.wishlist || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customer/wishlist/:productId
router.post('/wishlist/:productId', auth, requireRole('customer'), async (req, res) => {
  try {
    const profile = await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { wishlist: req.params.productId } },
      { new: true, upsert: true }
    );
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customer/wishlist/:productId
router.delete('/wishlist/:productId', auth, requireRole('customer'), async (req, res) => {
  try {
    await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { wishlist: req.params.productId } }
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== CART ===================

// GET /api/customer/cart
router.get('/cart', auth, requireRole('customer'), async (req, res) => {
  try {
    const profile = await CustomerProfile.findOne({ userId: req.user._id })
      .populate('cart.product');
    res.json(profile?.cart || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customer/cart
router.post('/cart', auth, requireRole('customer'), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const profile = await CustomerProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      await CustomerProfile.create({ userId: req.user._id, cart: [{ product: productId, quantity: quantity || 1 }] });
    } else {
      const existingItem = profile.cart.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity += (quantity || 1);
      } else {
        profile.cart.push({ product: productId, quantity: quantity || 1 });
      }
      await profile.save();
    }

    const updated = await CustomerProfile.findOne({ userId: req.user._id }).populate('cart.product');
    res.json({ message: 'Added to cart', cart: updated.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customer/cart/:productId
router.put('/cart/:productId', auth, requireRole('customer'), async (req, res) => {
  try {
    const { quantity } = req.body;
    const profile = await CustomerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Cart not found' });

    const item = profile.cart.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    if (quantity <= 0) {
      profile.cart = profile.cart.filter(i => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }
    await profile.save();

    const updated = await CustomerProfile.findOne({ userId: req.user._id }).populate('cart.product');
    res.json({ message: 'Cart updated', cart: updated.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customer/cart/:productId
router.delete('/cart/:productId', auth, requireRole('customer'), async (req, res) => {
  try {
    await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { cart: { product: req.params.productId } } }
    );
    res.json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== ORDERS ===================

// POST /api/customer/orders
router.post('/orders', auth, requireRole('customer'), async (req, res) => {
  try {
    const { items, deliveryType, paymentMethod, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Validate delivery+payment combo
    if (deliveryType === 'farmer_delivery' && paymentMethod === 'cod') {
      return res.status(400).json({ error: 'Cash on Delivery is only available for Self Pickup' });
    }

    // Group items by farmer
    const farmerGroups = {};
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      if (!farmerGroups[product.farmerId]) {
        farmerGroups[product.farmerId] = [];
      }
      farmerGroups[product.farmerId].push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    const orders = [];
    for (const [farmerId, orderItems] of Object.entries(farmerGroups)) {
      const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const farmerProfile = await FarmerProfile.findOne({ userId: farmerId });

      const order = new Order({
        customerId: req.user._id,
        farmerId,
        items: orderItems,
        totalAmount,
        deliveryType,
        paymentMethod,
        deliveryAddress: deliveryAddress || '',
        customerName: req.user.name,
        customerMobile: req.user.mobile,
        farmerUpi: farmerProfile?.upiId || ''
      });
      await order.save();
      orders.push(order);

      // Deduct stock
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    // Clear cart
    await CustomerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { cart: [] } }
    );

    res.status(201).json({ message: 'Order placed successfully', orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer/orders
router.get('/orders', auth, requireRole('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('deliveryPartner')
      .populate('farmerId', 'name mobile')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer/orders/:id
router.get('/orders/:id', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id })
      .populate('deliveryPartner')
      .populate('farmerId', 'name mobile');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customer/reviews
router.post('/reviews', auth, requireRole('customer'), async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    
    const existing = await Review.findOne({ productId, customerId: req.user._id });
    if (existing) return res.status(400).json({ error: 'You already reviewed this product' });

    const review = new Review({
      productId,
      customerId: req.user._id,
      orderId,
      rating,
      comment
    });
    await review.save();

    // Update product rating
    const allReviews = await Review.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10, totalReviews: allReviews.length });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer/dashboard
router.get('/dashboard', auth, requireRole('customer'), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ customerId: req.user._id });
    const activeOrders = await Order.countDocuments({
      customerId: req.user._id,
      status: { $nin: ['delivered', 'cancelled', 'rejected'] }
    });
    const recentOrders = await Order.find({ customerId: req.user._id })
      .populate('farmerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    const profile = await CustomerProfile.findOne({ userId: req.user._id });

    res.json({
      stats: { totalOrders, activeOrders, wishlistCount: profile?.wishlist?.length || 0, cartCount: profile?.cart?.length || 0 },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
