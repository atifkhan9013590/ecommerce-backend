const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
 category: {
    type: [String], // Array of category names
    default: [], // Default to an empty array
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
