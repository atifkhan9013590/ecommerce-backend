const mongoose = require ("mongoose");
const { Schema } = mongoose;

const subcategorySchema = new Schema({
  category: { type: String, required: true,unique:true },
  mainCategoryimg:String, 
});

const Category = mongoose.model("Category", subcategorySchema);
module.exports = Category;

