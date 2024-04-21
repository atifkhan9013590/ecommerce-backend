const express = require("express");
const admindb = require("../controller/admin.js");
const adminRouter = express.Router();
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware.js");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
     cb(null, "uploads/");  // Upload images to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Use the current timestamp as a unique filename
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  },
});

const upload = multer({ storage: storage });

adminRouter
  .post("/Signup", admindb.adminSignUp)
  .post("/Login", admindb.adminLogin)
  .post(
    "/update-profile",
    upload.single("picture"),
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.updateAdminProfile
  )
  .get(
    "/profile",
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.adminProfile
  )
  .post("/forget-password", admindb.forgotPassword)
  .post("/reset-password", admindb.resetPassword)
  .post("/Verify-otp", admindb.verifyOTP)
  .get(
    "/profileadmin",
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.getAdminProfile
  )
  .put(
    "/update",
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.updateAdminProfile
  )
  .post("/change-password",admindb.changePassword);

exports.adminRouter = adminRouter;
