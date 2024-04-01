const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema({
  userName: String,
  email: { type: String, unique: true, required: true },
  password: String,
  profile: {
    picture: { type: String, default: "" }, // Initialize as empty string
    name: String,
  },
  resetPasswordOTP: { type: Number, default: null },
});


const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
