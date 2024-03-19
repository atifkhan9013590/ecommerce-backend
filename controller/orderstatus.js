const Order = require("../model/order.js");

exports.OrderStatus = async (req, res) => {
  try {
    // Extract orderId from the request query parameter
    const orderId = req.query.OrderId;

    // Validate orderId presence
    if (!orderId) {
      return res.status(400).json({ message: "OrderId parameter is required" });
    }

    // Find the order based on the provided orderId
    const order = await Order.findOne({ OrderId: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ message: "No order found for the provided OrderId" });
    }

    res.status(200).json({
      message: "Order status retrieved successfully",
      order: {
        orderId: order.OrderId,
        status: order.status,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
