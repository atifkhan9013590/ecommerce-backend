const mongoose = require("mongoose");
const { Schema } = mongoose;


const UserSchema = new Schema({
  email: String,
  name: String,
  password: String,
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
});

const User = mongoose.model("User", UserSchema);

module.exports = User;