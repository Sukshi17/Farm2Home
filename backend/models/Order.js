const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'rejected', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  deliveryType: {
    type: String,
    enum: ['self_pickup', 'farmer_delivery'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    default: null
  },
  deliveryAddress: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerMobile: { type: String, default: '' },
  farmerUpi: { type: String, default: '' }
}, { timestamps: true });

orderSchema.index({ customerId: 1 });
orderSchema.index({ farmerId: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
