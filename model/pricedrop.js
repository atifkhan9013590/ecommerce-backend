const mongoose = require("mongoose");

const pricedropSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  productDescription: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
});

const PriceDropNotification = mongoose.model(
  "PriceDropNotification",
  pricedropSchema
);

module.exports = PriceDropNotification;
