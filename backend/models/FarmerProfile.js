const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  farmName: { type: String, default: '' },
  farmAddress: { type: String, default: '' },
  farmSize: { type: String, default: '' },
  cropTypes: [{ type: String }],
  upiId: { type: String, default: '' },
  documents: [{
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNote: { type: String, default: '' },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
