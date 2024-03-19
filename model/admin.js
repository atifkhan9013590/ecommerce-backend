// models/admin.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const profilePictureSchema = new Schema({
    data: Buffer,
    contentType: String,
});

const adminSchema = new Schema({
    userName: String,
    email: { type: String, unique: true, required: true },
    password: String,
    profile: {
        picture: profilePictureSchema,
        name: String,
    },
    resetPasswordOTP: { type: Number, default: null } // Add resetPasswordOTP field with default value null
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
