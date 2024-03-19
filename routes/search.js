const express = require("express");
const Productdb = require("../controller/search.js");
const SearchRouter = express.Router();



SearchRouter
.get("/:term", Productdb.SearchByName)

exports.SearchRouter=SearchRouter;