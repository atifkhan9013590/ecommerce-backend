const express = require("express");
const Productnotifydb = require("../controller/productNotification");
const NotifyRouter = express.Router();

NotifyRouter
.post("/notify-me", Productnotifydb.notifyMeWhenInStock)
.get("/",Productnotifydb.existingNotification);

exports.NotifyRouter=NotifyRouter;