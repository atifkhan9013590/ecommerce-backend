const mongoose = require('mongoose');
const Product = require('./product.js');

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        thumbnail: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        percentage: {
          type: Number,
        },
        cartQuantity: {
          type: Number,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
      },
    ],
    Email: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Delivered", "Processing", "Cancel"],
      default: "Pending",
    },
    OrderId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
