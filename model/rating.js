// rating.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ratingSchema = new Schema({
  email: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

ratingSchema.statics.createRating = async function (reviewData) {
  return this.create(reviewData);
};

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
