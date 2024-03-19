const express = require("express");

const filterdb = require('../controller/filter')

const FilterRouter = express.Router();

FilterRouter.get("/filterByPriceRange",filterdb.getProductsByPriceRange)
.get("/FetchProductCategory", filterdb.getCategoriesWithSubcategories);

exports.FilterRouter = FilterRouter;