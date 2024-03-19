
const mongoose = require("mongoose");
const { Schema } = mongoose;
const announcementSchema = new Schema({
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;

