const express = require("express");
const priceDropDb = require("../controller/pricedrop");
const PricedropsRouter = express.Router();

PricedropsRouter.post("/priceDrops", priceDropDb.notifyMeWhenPriceDrops)
.get(
  "/checkNotification",
  priceDropDb.existingNotification
);

exports.PricedropsRouter = PricedropsRouter;
