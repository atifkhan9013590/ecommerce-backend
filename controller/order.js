const Order = require("../model/order.js");
const User = require("../model/user.js");
const Coupon = require("../model/coupon.js");
const _ = require('lodash');
const Product = require('../model/product.js'); 
const OrderNotification = require('../model/notification.js');


const nodemailer = require("nodemailer");
const config = require("../config.js");
const stripe = require("stripe")(config.stripeSecretKey);
const twilio = require('twilio');
require("dotenv").config(); 











function generateEmailContent(
  orderProducts,
  totalAmount,
  firstName,
  lastName,
  address,
  city,
  postalCode
) {
  let content = "<h1>Order Details:</h1>";

  // Loop through order products and generate HTML for each
  orderProducts.forEach((product, index) => {
    content += `
      <div style="margin-bottom: 20px;">
        <p><strong>Description:</strong> ${product.description}</p>
        <p><strong>Quantity:</strong> ${product.cartQuantity}</p>
        <p><strong>Price:</strong> ${product.price}</p>
      </div>
    `;
  });

  // Add total amount section with styling
  content += `
    <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; margin-top: 20px;">
      <p><strong>Total Amount:</strong> ${totalAmount}</p>
    </div>
  `;

  // Add shipping address section
  content += `<h2>Shipping Address</h2>`;
  content += `<p><strong>First Name:</strong> ${firstName}</p>`;
  content += `<p><strong>Last Name:</strong> ${lastName}</p>`;
  content += `<p><strong>Address:</strong> ${address}</p>`;
  content += `<p><strong>City:</strong> ${city}</p>`;
  content += `<p><strong>Postal Code:</strong> ${postalCode}</p>`;

  return content;
}


// Helper function to generate attachments for thumbnails
function generateThumbnailAttachments(orderProducts) {
  return orderProducts.map((product, index) => ({
    filename: `thumbnail_${index + 1}.png`, // You can adjust the filename as needed
    content: product.thumbnail.replace(/^data:image\/png;base64,/, ""),
    encoding: "base64",
  }));
}

async function sendOrderConfirmationEmailGmail(toEmail, content, attachments) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: toEmail,
      subject: "Order Confirmation",
      html: content,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}

async function sendOrderConfirmationEmail(
  orderData,
  userEmail,
  firstName,
  lastName,
  address,
  city,
  postalCode
) {
  try {
    const { products, totalAmount } = orderData;

    // Generate email content
    const emailContent = generateEmailContent(
      products,
      totalAmount,
      firstName,
      lastName,
      address,
      city,
      postalCode
    );

    // Generate attachments for thumbnails
    const thumbnailAttachments = generateThumbnailAttachments(products);

    // Send order confirmation email with attachments
    await sendOrderConfirmationEmailGmail(
      userEmail,
      emailContent,
      thumbnailAttachments
    );
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
}


// Function to generate a random order ID
function generateOrderId() {
  const orderId = Math.floor(10000 + Math.random() * 90000).toString();
  return orderId;
}

exports.placeOrder = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const orderId = generateOrderId();
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail }).populate({
      path: "cart",
      model: "Product",
      select:
        "_id name title  cartQuantity stockQuantity category description percentage price thumbnail quantity",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Incomplete Order Details:", req.body);

    const {
      Email,
      totalAmount,
      country,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phoneNumber,
      paymentMethod,
      product,
    } = req.body;

    const requiredFields = [
      "Email",
      "totalAmount",
      "country",
      "firstName",
      "lastName",
      "address",
      "city",
      "postalCode",
      "phoneNumber",
      "paymentMethod",
    ];

    // Check for missing required fields
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      console.error(
        "Incomplete order details. Missing fields:",
        missingFields.join(", ")
      );
      return res.status(400).json({
        message:
          "Incomplete order details. Please provide all required information.",
        missingFields: missingFields,
      });
    }

    if (
      !Email ||
      !country ||
      !firstName ||
      !lastName ||
      !address ||
      !city ||
      !postalCode ||
      !phoneNumber ||
      !totalAmount ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message:
          "Incomplete order details. Please provide all required information.",
      });
    }

    console.log("Order Payload from Frontend:", req.body);

    let order;

    order = new Order({
      OrderId: orderId,
      user: user._id,
      products: user.cart.map((item) => ({
        product: item.productDetails.id,
        thumbnail: item.productDetails.thumbnail,
        name: item.productDetails.name,
        category: item.productDetails.category,
        percentage: item.productDetails.percentage,
        description: item.productDetails.description,
        price: item.productDetails.price,
        stockQuantity: item.productDetails.stockQuantity,
        quantity: item.productDetails.quantity,
        cartQuantity: item.cartQuantity,
      })),
      Email,
      totalAmount,
      country,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phoneNumber,
      paymentMethod,
    });

    for (const item of user.cart) {
      console.log("Current item:", item);
      const product = await Product.findById(item.productDetails.id);
      console.log("Retrieved product:", product);

      if (!product) {
        console.log("ITEMS", item);
        return res.status(404).json({
          message: `Product not found for cart item: ${item}`,
        });
      }

      // Subtract cart quantity from stock quantity
      product.stockQuantity -= item.cartQuantity;
      await product.save();
    }

    if (paymentMethod === "Cash") {
      await order.save();
    } else if (paymentMethod === "Stripe") {
      const stripe = require("stripe")(config.stripeSecretKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "pkr",
        payment_method_types: ["card"],
        confirm: true,
        confirmation_method: "manual",
        payment_method: "pm_card_visa",
        receipt_email: Email,
        description: `${firstName} ${lastName}`,
      });

      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    user.orderHistory.push(order);
    await user.save();
    // Clear user's cart if products are from user's cart
    if (!product) {
      user.cart = [];
      await user.save();
    }

    // Send email confirmation
     await sendOrderConfirmationEmail(
       order,
       Email,
       firstName,
       lastName,
       address,
       city,
       postalCode
     );

    // Save order notification
    const notificationMessage = `${Email} placed Order:${totalAmount}.00pkr`;
    const orderNotification = new OrderNotification({
      orderId: order._id,
      message: notificationMessage,
    });
    await orderNotification.save();

    return res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}; 

exports.allOrder = async (req, res) => {
  try {
    const orders = await Order.find();

    res.status(200).json({ message: "Orders retrieved successfully", orders });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate the status
    const validStatuses = ["Pending", "Delivered", "Processing", "Cancel"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Save the current status to check if it has changed
    const previousStatus = order.status;

    // Update the order status
    order.status = status;
    await order.save();

    // Send email notification if the status has changed
    if (previousStatus !== status) {
      await sendOrderStatusEmail(order.Email, status);
    }

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Helper function to send order status email
async function sendOrderStatusEmail(userEmail, status) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your Gmail address
        pass: process.env.MY_PASSWORD, // Your Gmail app password
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: userEmail,
      subject: "Order Status Update",
      text: `Your order status has been updated to: ${status}`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Calculate the total amount with discount for the response
    let totalAmountWithDiscount = order.totalAmount;

    if (order.discount) {
      // Subtract the discount amount from the total amount
      totalAmountWithDiscount -= order.discount.amount;
    }

    // Include the total amount with discount in the response
    order.totalAmountWithDiscount = totalAmountWithDiscount;

    res.status(200).json({ message: "Order retrieved successfully", order });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.DeleteOrders = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Remove the order from the database
    await order.deleteOne(); // Use deleteOne() instead of remove()

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


exports.getAllOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const processingOrders = await Order.countDocuments({
      status: "Processing",
    });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });

    res.status(200).json({
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getTopProductDescriptions = async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find();

    // Extract product descriptions from all orders
    const allProductDescriptions = orders.flatMap(order =>
      order.products.map(product => product.category)
    );

    // Count occurrences of each product description
    const productDescriptionCounts = _.countBy(allProductDescriptions);

    // Sort the descriptions by count in descending order
    const sortedProductDescriptions = Object.entries(productDescriptionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 4); // Get the top 5 descriptions (adjust as needed)

    // Prepare data for chart
    const chartData = {
      labels: sortedProductDescriptions.map(([category]) => category),
      series: [sortedProductDescriptions.map(([, count]) => count)],
    };

    res.status(200).json({
      message: "Top product descriptions retrieved successfully",
      chartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


exports.getMonthlyOrders = async (req, res) => {
  try {
    // Query the database to aggregate monthly order data
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month
          totalOrders: { $sum: 1 } // Count total orders in each month
        }
      },
      {
        $sort: { "_id": 1 } // Sort by month in ascending order
      }
    ]);

    // Prepare response data
    const labels = monthlyOrders.map(monthlyOrder => {
      // Format month (e.g., 1 for January, 2 for February, etc.)
      const month = new Date(0, monthlyOrder._id - 1).toLocaleString('en-US', { month: 'long' });
      return month;
    });
    const series = monthlyOrders.map(monthlyOrder => monthlyOrder.totalOrders);

    // Send response
    res.status(200).json({ labels, series });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order status is "pending"
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Order cannot be cancelled. Status is not pending." });
    }

    // Update the order status to "cancelled"
    order.status = "Cancel";
    await order.save();

    // Send cancellation email to the user
    await sendCancellationEmail(order.Email);

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

async function sendCancellationEmail(userEmail) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your Gmail address
        pass: process.env.MY_PASSWORD, // Your Gmail app password
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: userEmail,
      subject: "Order Cancellation",
      text: "Your order has been cancelled.",
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}





// Function to generate a random order ID
function generateOrderId() {
  const orderId = Math.floor(10000 + Math.random() * 90000).toString();
  return orderId;
}

exports.placeOrderWithProduct = async (req, res) => {
  try {
    const orderId = generateOrderId();
    const {
      Email,
      country,
      firstName,
      totalAmount,
      lastName,
      address,
      city,
      postalCode,
      phoneNumber,
      paymentMethod,
      products,
    } = req.body;

    // Log the request body
    console.log("Request Body:", req.body);

    // Check if all required fields are present
    const requiredFields = [
      "Email",
      "country",
      "firstName",
      "totalAmount",
      "lastName",
      "address",
      "city",
      "postalCode",
      "phoneNumber",
      "paymentMethod",
      "products",
    ];

    // Check for missing required fields
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message:
          "Incomplete order details. Please provide all required information.",
        missingFields: missingFields,
      });
    }

    // Create the order object
    const order = new Order({
      OrderId: orderId,
      products: products.map((product) => ({
        product: product._id,
        thumbnail: product.thumbnail,
        description: product.description,
        price: product.price,
        percentage: product.percentage,
        cartQuantity: product.cartQuantity,
        category: product.category,
      })),
      Email,
      totalAmount,
      country,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phoneNumber,
      paymentMethod,
    });

    // Fetch the user based on email
    const user = await User.findOne({ email: Email });

    console.log("User:", user); // Add this line to check the fetched user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Push the order into the user's order history
    user.orderHistory.push(order);

    console.log("User after pushing order:", user); // Add this line to check user after pushing order

    // Save the user
    await user.save();
    await order.save();

    // Log the payload after saving the order
    console.log("Payload after saving order:", order);

    // Update product stock quantity
    for (const product of products) {
      // Find the product by its _id and update its stock quantity
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stockQuantity: -product.cartQuantity } }
      );
    }

    // Send order confirmation email
    const emailContent = generateEmailContent(products, totalAmount);
   await sendOrderConfirmationEmail(
     order,
     Email,
     firstName,
     lastName,
     address,
     city,
     postalCode
   );

    // Save order notification
    const notificationMessage = `${Email} placed Order:${totalAmount}.00pkr`;
    const orderNotification = new OrderNotification({
      orderId: order._id,
      message: notificationMessage,
    });
    await orderNotification.save();

    return res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.filterOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const filteredOrders = await Order.find({ status });

    res
      .status(200)
      .json({
        message: `Orders filtered by status: ${status}`,
        orders: filteredOrders,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Controller function to filter orders by last N days
exports.filterOrdersByDays = async (req, res) => {
  try {
    const { days } = req.params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filteredOrders = await Order.find({ createdAt: { $gte: startDate } });

    res
      .status(200)
      .json({
        message: `Orders filtered by last ${days} days`,
        orders: filteredOrders,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};