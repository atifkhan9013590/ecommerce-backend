const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: String,
  name: String,
  lastName: String,
  password: String,
  verify: {
    type: Boolean,
    default: false,
  },
  otp: String, // Storing OTP
  otpExpiresAt: Date, // Expiration timestamp for OTP
  cart: [
    {
      productDetails: {
        type: Schema.Types.Mixed,
      },
      cartQuantity: {
        type: Number,
      },
    },
  ],
  wishlist: [
    {
      productDetails: {
        type: Schema.Types.Mixed,
      },
    },
  ],
  orderHistory: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  coupon: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    default: null,
  },
  resetPasswordOTP: {
    type: String,
    default: null,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  searchHistory: [
    {
      query: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  addresses: [
    {
      email: {
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
      country: {
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
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

