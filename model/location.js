const mongoose = require("mongoose");
const { Schema } = mongoose;



const locationSchema = new Schema({
  Address: String,
  
});

const Location = mongoose.model("Location", locationSchema);
module.exports = Location;
