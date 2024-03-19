const express = require('express');
const Categorydb = require('../controller/category.js');

const  CategoryRouter  = express.Router(); // Import the CategoryRouter

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
CategoryRouter
.post('/',upload.fields([
  { name: 'mainCategoryimg', maxCount: 1 }, 

]), Categorydb.createCategory)
.get('/',Categorydb.getAllCategories)
.delete('/:id',Categorydb.deleteCategoryById)
.put('/:id', Categorydb.updateCategoryById);

exports.CategoryRouter = CategoryRouter;
