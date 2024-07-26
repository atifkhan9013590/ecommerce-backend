const Product = require("../model/product");
const ProductNotification = require("../model/pricedrop");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Function to send notification emails
async function sendPriceDropNotificationEmail(
  userEmail,
  productDescription,
  sku,
  currentPrice,
  thumbnail
) {
  try {
    console.log("Thumbnail data:", thumbnail); // Log thumbnail data

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
      subject: "Price Drop Notification",
      html: `<p>The price of <strong>"${productDescription}"</strong> has dropped. The current price is Rs: ${currentPrice}. Search with this code ${sku} on Our Site!</p>`,
      attachments: [
        {
          filename: `thumbnail_${Date.now()}.png`, // Adjust filename as needed
          content: thumbnail.replace(/^data:image\/png;base64,/, ""), // Remove the data URL prefix
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Price drop notification email sent to:", userEmail);
  } catch (error) {
    console.error(
      "Error sending price drop notification email:",
      error.message
    );
  }
}

async function checkProductAvailabilityAndSendNotifications() {
  try {
    // Find all product notification requests where the product is not notified
    const notifications = await ProductNotification.find({ notified: false });

    for (const notification of notifications) {
      const product = await Product.findById(notification.productId);

      if (!product) {
        console.error(
          "Product not found for notification:",
          notification.productId
        );
        continue; // Skip to the next notification
      }

      // Calculate the current price of the product
      const currentPrice = product.discountPercentage
        ? product.price - (product.discountPercentage / 100) * product.price
        : product.price;

      // Check if the current price is less than the original price
      if (currentPrice < notification.originalPrice) {
        // Send price drop notification email to the user
        await sendPriceDropNotificationEmail(
          notification.userEmail,
          product.description,
          product.sku,
          currentPrice,
          product.thumbnail // Pass the product thumbnail
        );

        // Delete the notification from the database
        await ProductNotification.findByIdAndDelete(notification._id);

        console.log(
          "Price drop notification email sent to:",
          notification.userEmail
        );
      }
    }
  } catch (error) {
    console.error("Error checking product availability:", error);
  }
}

// Schedule the background task to run at regular intervals
setInterval(checkProductAvailabilityAndSendNotifications, 1 * 60 * 1000); // Run every 1 minute

// Optionally, you can run the task immediately when the server starts
checkProductAvailabilityAndSendNotifications();

exports.notifyMeWhenPriceDrops = async (req, res) => {
  try {
    const { productId, userEmail, productDescription,thumbnail, sku } = req.body;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate the current price of the product
    const currentPrice = product.discountPercentage
      ? product.price - (product.discountPercentage / 100) * product.price
      : product.price;

    // Check if a notification already exists for this product and user
    const existingNotification = await ProductNotification.findOne({
      productId,
      userEmail,
    });

    if (existingNotification) {
      return res
        .status(400)
        .json({ message: "Notification request already exists" });
    }

    // Create a new notification request
    const newNotification = new ProductNotification({
      productId,
      userEmail,
      productDescription,
      thumbnail,
      sku,
      originalPrice: currentPrice,
    });

    await newNotification.save();

    res.status(201).json({ message: "Notification request received" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.existingNotification = async (req, res) => {
  try {
    const { productId, userEmail } = req.query;

    // Check if a notification exists for the provided product ID and user email
    const existingNotification = await ProductNotification.findOne({
      productId,
      userEmail,
    });

    // Send response indicating whether a notification exists
    res.status(200).json({ exists: !!existingNotification });
  } catch (error) {
    console.error("Error checking notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
