const mongoose = require("mongoose");
const { Schema } = mongoose;

const Rating = require("./rating");

const productSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number },
  discountPercentage: { type: Number },
  category: String,
  subcategory: {
    type: String,
    required: true,
  },
  thumbnail: String,
  image1: String,
  image2: String,
  image3: String,
  images: [String], // Store images in an array
  quantity: { type: Number, default: 1 },
  stockStatus: { type: String, enum: ["In Stock", "Out of Stock"], default: "In Stock" },
  stockQuantity: { type: Number },
  reviews: [{
    email: String,
    rating: Number,
    comment: String,
    timestamp: { type: Date, default: Date.now },
  }], 
  sku: { type: String, unique: true }
});

// Before saving the product, push the thumbnail and images into the 'images' array
productSchema.pre('save', function(next) {
  this.images = [];
  if (this.thumbnail) this.images.push(this.thumbnail);
  if (this.image1) this.images.push(this.image1);
  if (this.image2) this.images.push(this.image2);
  if (this.image3) this.images.push(this.image3);
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
