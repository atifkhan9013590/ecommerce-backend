const mongoose = require("mongoose");

const productNotificationSchema = new mongoose.Schema({
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
    // Add the productDescription field to the schema
    type: String,
    required: true,
  },
  sku: {
     type: String, 
     required: true },
});

const ProductNotification = mongoose.model(
  "ProductNotification",
  productNotificationSchema
);

module.exports = ProductNotification;
