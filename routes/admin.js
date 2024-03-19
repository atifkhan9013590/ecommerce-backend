const express=require('express')
const admindb=require('../controller/admin.js')
const adminRouter=express.Router();
const adminAuthMiddleware =require('../middleware/adminAuthMiddleware.js')
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

adminRouter
.post('/Signup',admindb.adminSignUp)
.post('/Login',admindb.adminLogin)
.post('/update-profile',upload.single('picture'), adminAuthMiddleware.adminAuthMiddleware, admindb.updateAdminProfile)
.get('/profile',adminAuthMiddleware.adminAuthMiddleware,admindb.adminProfile)
.post('/forget-password',admindb.forgotPassword)
.post('/reset-password',admindb.resetPassword)
.post('/Verify-otp',admindb.verifyOTP)

exports.adminRouter=adminRouter