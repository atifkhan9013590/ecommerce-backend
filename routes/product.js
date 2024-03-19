const express = require("express");
const fs = require("fs");
const Productdb = require("../controller/product.js");
const ProductRouter = express.Router();
const multer = require("multer");
const path = require("path");

// Check if the uploads directory exists, if not, create it
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Upload images to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Use the current timestamp as a unique filename
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  },
});


const upload = multer({ storage: storage });

ProductRouter.get("/", Productdb.getAllProduct)

  .post(
    "/",
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "image1", maxCount: 1 },
      { name: "image2", maxCount: 1 },
      { name: "image3", maxCount: 1 },
    ]),

    Productdb.CreateProduct
  )

  .put("/:productId", Productdb.updateProduct)
  .get("/:id", Productdb.SearchById)

  .delete("/:id", Productdb.DeleteProduct)
  .get("/category/:category", Productdb.getAllProductcategory)
  .post("/increaseQuantity/:productId", Productdb.IncreaseQuantity)
  
  .post("/decreaseQuantity/:productId", Productdb.DecreaseQuantity)
  .get("/stocks", Productdb.StockStatus)

  .get("/subcategory/:subcategory", Productdb.getALLproductsubCategory)

  .get("/:category/sort/az", Productdb.sortAlphabeticallyAZ)

  .get("/:category/sort/za", Productdb.sortAlphabeticallyZA)

  .get("/:category/sort/price/low", Productdb.sortByPriceLow)

  .get("/:category/sort/price/high", Productdb.sortByPriceHigh)
  
 


exports.ProductRouter = ProductRouter;
