const express = require("express");

const PrdDb = require("../controller/productsearch");
const ProductSearchRouter = express.Router();

ProductSearchRouter
.get("/:productId", PrdDb.getProductById);

exports.ProductSearchRouter=ProductSearchRouter;