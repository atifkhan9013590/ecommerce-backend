const express = require('express');
const Bannerdb = require('../controller/banner.js');

const  BannerRouter  = express.Router(); 

const multer = require('multer');

const path = require('path');

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Upload images to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Use the current timestamp as a unique filename
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  },
});

const upload = multer({ storage: storage });

// Define the route and use the Multer middleware
BannerRouter
.post('/',upload.fields([
  { name: 'bannerimg', maxCount: 1 }, 

]), Bannerdb.createBanner)
.get('/',Bannerdb.getAllBanner)
.delete('/:id',Bannerdb.deleteBannerById)
.put('/:id', Bannerdb.updateBannerById);

exports.BannerRouter = BannerRouter;
