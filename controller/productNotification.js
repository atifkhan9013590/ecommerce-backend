const Product = require("../model/product");
const ProductNotification = require("../model/productNotification");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Function to send notification emails
async function sendProductNotificationEmail(
  userEmail,
  sku,
  productDescription
) {
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
      subject: "Product Back in Stock",
      html: `<p>The <strong>" ${productDescription}"</strong> is back in stock.</p>
          
            <p>Search with this code ${sku} in Our Site!</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Product notification email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending product notification email:", error.message);
  }
}


// Function to check product availability and send notifications
async function checkProductAvailabilityAndSendNotifications() {
  try {
    // Find all product notification requests where the product is out of stock
    const outOfStockNotifications = await ProductNotification.find({
      notified: false,
    }).populate("productId"); // Populate the productId field to get the actual product document

    for (const notification of outOfStockNotifications) {
      const product = notification.productId; // Now product will contain the actual product document

      // Check if the product is back in stock
      if (product.stockQuantity > 0) {
        // Send notification email to the user
        // Inside checkProductAvailabilityAndSendNotifications function
        await sendProductNotificationEmail(
          notification.userEmail,
          product.sku, // Pass the sku value instead of product name
          product.description
        );

        // Update notification flag to indicate that the user has been notified
        notification.notified = true;
        await notification.save();
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

exports.notifyMeWhenInStock = async (req, res) => {
  try {
    const { productId, userEmail, productDescription,sku } = req.body;

   
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the notification request already exists
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
      sku,
     
    });

    await newNotification.save();

    res.status(201).json({ message: "Notification request received" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
