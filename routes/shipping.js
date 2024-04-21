const express = require("express");
const Shippingdb = require("../controller/shipping");

const ShippingRouter = express.Router();

ShippingRouter
.post("/", Shippingdb.postShippping)
  .get("/", Shippingdb.getShipping)
  .delete("/:Id", Shippingdb.deleteShipping);

exports.ShippingRouter = ShippingRouter;
