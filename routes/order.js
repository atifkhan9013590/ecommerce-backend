const express = require('express');
const Orderdb = require('../controller/order.js');
const OrderRouter = express.Router();
const authMiddleware = require('../middleware/authMiddleware.js');


    OrderRouter.post("/", authMiddleware.authMiddleware, Orderdb.placeOrder)
      .get("/description", Orderdb.getTopProductDescriptions)
      .get("/monthly", Orderdb.getMonthlyOrders)

      .get("/stats", Orderdb.getAllOrderStats)
      .get("/:orderId", Orderdb.getOrderById)
      .put("/:orderId/status", Orderdb.updateOrderStatus)
      .get("/", Orderdb.allOrder)
      .delete("/delete/:orderId", Orderdb.DeleteOrders)
      .delete("/cancel/:orderId", Orderdb.cancelOrder)
      .post(
        "/buyNow",
        authMiddleware.authMiddleware,
        Orderdb.placeOrderWithProduct
      )
      .get(
        "/filterByStatus/:status",
      Orderdb.filterOrdersByStatus
      )
  .get("/filterByDays/:days", Orderdb.filterOrdersByDays);
      
      


exports.OrderRouter=OrderRouter
