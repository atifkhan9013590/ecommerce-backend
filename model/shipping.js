const mongoose = require("mongoose");
const { Schema } = mongoose;

const shippingSchema = new Schema({
  ShippingPolicy: String,
});

const Shipping = mongoose.model(" Shipping", shippingSchema);
module.exports = Shipping;
