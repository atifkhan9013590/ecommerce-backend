const mongoose = require("mongoose");
const { Schema } = mongoose;

const bannerSchema = new Schema({
  category: { type: String, required: true },
  subcategory:{ type: String, required: true},
  bannerimg:String, 
});

const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;

