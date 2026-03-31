const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  totalDeliveries: { type: Number, default: 0 }
}, { timestamps: true });

deliveryPartnerSchema.index({ farmerId: 1 });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
