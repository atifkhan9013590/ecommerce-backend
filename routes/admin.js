const express = require("express");
const admindb = require("../controller/admin.js");
const adminRouter = express.Router();
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware.js");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for storing profile pictures
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

// Multer upload configuration
const upload = multer({ storage: storage });

adminRouter
  .post("/Signup", admindb.adminSignUp)
  .post("/Login", admindb.adminLogin)

  .get(
    "/profile",
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.adminProfile
  )
  .post("/forget-password", admindb.forgotPassword)
  .post("/reset-password", admindb.resetPassword)
  .post("/Verify-otp", admindb.verifyOTP)
  .post("/resend", admindb.ResendOtp)
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
  .post("/change-password", admindb.changePassword)
  .post(
    "/profile-picture",
    upload.single("profilePicture"),
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.uploadProfilePicture
  )
  .get('/getprofilePicture',adminAuthMiddleware.adminAuthMiddleware,admindb.getProfilePicture)

  .post(
    "/UpdatePicture",
    upload.single("profilePicture"),
    adminAuthMiddleware.adminAuthMiddleware,
    admindb.updateProfilePicture
  );
  

exports.adminRouter = adminRouter;
