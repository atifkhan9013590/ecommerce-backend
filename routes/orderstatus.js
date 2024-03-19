const express = require("express");
const Orderstatusdb = require("../controller/orderstatus");
const OrderStatusRouter = express.Router();

OrderStatusRouter
.get("/status", Orderstatusdb.OrderStatus);

exports.OrderStatusRouter = OrderStatusRouter;
