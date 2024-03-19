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



function calculateTotalAmount(cart) {
  return cart.reduce((total, item) => {
    const itemPrice = item.productDetails.price || 0;
    const itemQuantity = item.cartQuantity || 0;
    const discountPercentage = item.productDetails.percentage || 0;

    const discountedPrice = itemPrice - (itemPrice * discountPercentage) / 100;

    return total + discountedPrice * itemQuantity;
  }, 0);
}



// Helper function to send order confirmation email using Ethereal
async function sendOrderConfirmationEmailGmail(toEmail, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "almarjan366@gmail.com", // Your Gmail address
        pass: "rzll zpcw vtkj fosi",   // Your Gmail app password
      },
    });

    const info = await transporter.sendMail({
      from: "almarjan366@gmail.com",
      to: toEmail,
      subject: "Order Confirmation",
      text: content,
    });

    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}



// Helper function to generate email content
function generateEmailContent(orderProducts, totalAmount) {
  let content = "Order Details:\n\n";

  orderProducts.forEach((product, index) => {
    content += `${index + 1}. ${product.description} - Quantity: ${
      product.cartQuantity
      
    } - Price: ${product.price}\n`;
  });

  content += `\nTotal Amount: ${totalAmount}`;

  return content;
}
function generateOrderId() {
  const orderId = Math.floor(10000 + Math.random() * 90000).toString();
  return orderId;
}

exports.placeOrder = async (req, res) => {
  try {
     const orderId = generateOrderId();

     // Set the generated OrderId in the request body
  
    const userEmail = req.user.email;

    const user = await User.findOne({ email: userEmail }).populate({
      path: "cart",
      model: "Product",
      select: "name title  cartQuantity stockQuantity category description percentage price thumbnail quantity",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        message: "Cart is empty. Add items to the cart before placing an order.",
      });
    }
console.log("Incomplete Order Details:", req.body);

    const {
      Email,
      country,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phoneNumber,
      paymentMethod,
      couponCode,
    } = req.body;

    const requiredFields = [
      "Email",
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
      !paymentMethod
    ) {
      return res.status(400).json({
        message: "Incomplete order details. Please provide all required information.",
      });
    }
console.log("Order Payload from Frontend:", req.body);
    let totalAmount = calculateTotalAmount(user.cart);
    let order;

    for (const cartItem of user.cart) {
      const productDetails = cartItem.productDetails;

      if (!productDetails) {
        return res.status(404).json({
          message: `Product details not found for cart item: ${cartItem}`,
        });
      }

      const product = await Product.findById(productDetails.id);

      if (!product) {
        return res.status(404).json({
          message: `Product not found for cart item: ${cartItem}`,
        });
      }

      if (!product.quantity || product.quantity > product.stockQuantity) {
        return res.status(400).json({
          message: `Invalid quantity for ${product.title}. Available stock: ${product.stockQuantity}`,
        });
      }

      product.stockQuantity -= product.quantity;
      await product.save();
    }

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });

      if (coupon) {
        const discountPercentage = coupon.discountPercentage || 0;
        const discountAmount = (totalAmount * discountPercentage) / 100;
        totalAmount -= discountAmount;

        // Check if any product description matches the coupon description
        const matchingProduct = user.cart.find(item => item.productDetails.category === coupon.category);

        if (matchingProduct) {
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
            discount: {
              code: couponCode,
              percentage: discountPercentage,
              amount: discountAmount,
            },
          });
        } else {
          // Apply coupon without description
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
            discount: {
              code: couponCode,
              percentage: discountPercentage,
              amount: discountAmount,
            },
          });
        }
      }
    }

    if (!order) {
      order = new Order({
        OrderId: orderId,
        user: user._id,
        products: user.cart.map((item) => ({
          product: item.productDetails.id,
          thumbnail: item.productDetails.thumbnail,
          description: item.productDetails.description,
          name: item.productDetails.name,
          category: item.productDetails.category,
          percentage: item.productDetails.percentage,
          price: item.productDetails.price,
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
    }
 console.log("Order Payload before Saving:", order);
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

      const populatedOrder = await Order.findById(order._id).populate({
        path: "products.product",
        model: "Product",
        select: "name category description percentage price thumbnail quantity",
      });

      user.orderHistory.push(order._id);
      user.cart = [];
      await user.save();

      const emailContent = generateEmailContent(populatedOrder.products, totalAmount);
      await sendOrderConfirmationEmailGmail(Email, emailContent);

      const notificationMessage = `${Email} placed Order: ${totalAmount}pkr`;
      const orderNotification = new OrderNotification({ // Corrected model name
        orderId: order._id,
        message: notificationMessage,
      });
      await orderNotification.save();

      return res.status(201).json({ message: "Order placed successfully" });
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    user.orderHistory.push(order._id);
    user.cart = [];
    await user.save();

    const emailContent = generateEmailContent(order.products, totalAmount);
    await sendOrderConfirmationEmailGmail(Email, emailContent);

    const notificationMessage = `${Email} placed Order:${totalAmount}.00pkr`;
    const orderNotification = new OrderNotification({ // Corrected model name
      orderId: order._id,
      message: notificationMessage,
    });
    await orderNotification.save();

    return res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
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
        user: "almarjan366@gmail.com", // Your Gmail address
        pass: "rzll zpcw vtkj fosi",      // Your Gmail app password
      },
    });

    const mailOptions = {
      from: "almarjan366@gmail.com",
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
        user: "almarjan366@gmail.com", // Your Gmail address
        pass: "rzll zpcw vtkj fosi",   // Your Gmail app password
      },
    });

    const mailOptions = {
      from: "almarjan366@gmail.com",
      to: userEmail,
      subject: "Order Cancellation",
      text: "Your order has been cancelled."
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}