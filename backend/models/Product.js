const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  quantity: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'spices', 'organic', 'other'],
    default: 'other'
  },
  image: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ farmerId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);
