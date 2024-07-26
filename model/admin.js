const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema({
  userName: String,
  email: { type: String, unique: true, required: true },
  password: String,
  resetPasswordOTP: { type: Number, default: null },
  profilePicture: String,
});


const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
