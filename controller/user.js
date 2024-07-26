const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const config = require("../config");

const Product = require("../model/product");

const Coupon = require("../model/coupon");

const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

async function sendOrderOTPEmailGmail(toEmail, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your Gmail address
        pass: process.env.MY_PASSWORD, // Your Gmail app password
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: toEmail,
      subject: "OTP",
      text: content,
    });

    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}

const generateFourDigitOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

async function sendWelcomeEmail(email) {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    // Configure your email service provider here
    service: "Gmail",
    auth: {
      user: process.env.MY_EMAIL, // Your Gmail address
      pass: process.env.MY_PASSWORD,
    },
  });

  // Email message options
  const mailOptions = {
    from: process.env.MY_EMAIL,
    to: email,
    subject: "Welcome to Marjan Store",
    text: ` Welcome to Marjan Store! We are glad to have you onboard.`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}
const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your email username
        pass: process.env.MY_PASSWORD, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Verification OTP",
      text: `Your OTP for email verification is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const removeUnverifiedUsers = async () => {
  try {
    // Find unverified users whose OTP expiration time has passed
    const unverifiedUsers = await User.find({
      verify: false,
      otpExpiresAt: { $lt: Date.now() },
    });

    // Remove unverified users from the database
    await Promise.all(
      unverifiedUsers.map(async (user) => {
        try {
          // Ensure that user is a Mongoose model instance before calling remove()
          if (user instanceof User) {
            await user.deleteOne();
            console.log(`Removed unverified user: ${user.email}`);
          } else {
            console.error(`Invalid user object: ${user}`);
          }
        } catch (error) {
          console.error(`Error removing unverified user: ${user.email}`, error);
        }
      })
    );
  } catch (error) {
    console.error("Error removing unverified users:", error);
  }
};

// Define a function to periodically check for unverified users

// Set interval to periodically check for unverified users
setInterval(removeUnverifiedUsers, 1000); // Check every 5 minutes (5 * 60 * 1000 milliseconds)

// Call the function to start checking for unverified users
removeUnverifiedUsers();

exports.signUp = async (req, res) => {
  const { email, name, password, lastName } = req.body;
  try {
    const ifExistUser = await User.findOne({ email: email.toLowerCase() });
    if (ifExistUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const newUser = new User({
      email: email.toLowerCase(),
      name,
      lastName,
      password: hashpassword,
      otp,
      otpExpiresAt: Date.now() + 200000, // OTP expires in 10 minutes (600000 milliseconds)
    });
    await newUser.save();

    await sendOTP(email.toLowerCase(), otp);
    

    res.status(201).json({ message: "User Registered" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "An error occurred while registering" });
  }
};

exports.verifyOTPS = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase(), otp });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    user.verify = true;
    await user.save();
    await sendWelcomeEmail(email)
    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "An error occurred while verifying OTP" });
  }
};
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 200000; // OTP expires in 10 minutes (600000 milliseconds)
    await user.save();

    // Send the new OTP to the user's email
    await sendOTP(email.toLowerCase(), otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "An error occurred while resending OTP" });
  }
};

exports.changePassword = async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if the current password matches the stored password
    const isPasswordMatch = await  bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }
    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }
    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating password" });
  }
};

exports.getAllRegisterUser = async (req, res) => {
  try {
    const allUser = await User.find({});
    res.status(200).json(allUser);
  } catch (err) {
    res.status(500).json({ err: "No User to show" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.deleteSelectedUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    // Check if userIds is not provided or is not an array
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // Delete the selected users from the database
    await User.deleteMany({ _id: { $in: userIds } });

    // Send a success response
    res.status(200).json({ message: "Selected users deleted successfully" });
  } catch (error) {
    console.error("Error deleting selected users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Email is incorrect" });
    }

    if (!user.verify) {
      return res.status(402).json({ message: "Account not verified" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    // Assign a common coupon to the user
    const commonCoupon = await Coupon.findOne({
      /* Add conditions if necessary */
    });

    if (commonCoupon) {
      user.coupon = commonCoupon._id;
      await user.save();
    }

    // Retrieve the coupon details
    const couponDetails = await Coupon.findById(user.coupon);

    res.json({
      message: "Authentication successful",
      token: jwt.sign(
        { email: user.email, id: user._id },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      ),
      user: {
        email: user.email,
        password: user.password,
        id: user._id,
        coupon: user.coupon,
      },
      couponDetails,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred during authentication" });
  }
};

exports.getUserEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const useremail = await User.findOne({ email });
    if (!useremail) {
      res.status(200).json({ message: "no user with such email" });
    }
    res.json(email);
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
};
exports.AddToCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized - Invalid token or user information missing",
      });
    }

    const userId = req.user.id;
    const { productDetails } = req.body; // Only extract productDetails from the request body

    if (!productDetails) {
      return res.status(400).json({ message: "Invalid product details" });
    }

    // Extract productDetails and cartQuantity separately from the request body
    const { cartQuantity, ...restProductDetails } = productDetails;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.cart) {
      user.cart = [];
    }

    // Check if the product already exists in the user's cart
    const existingProductIndex = user.cart.findIndex(
      (item) =>
        JSON.stringify(item.productDetails) ===
        JSON.stringify(restProductDetails)
    );

    if (existingProductIndex !== -1) {
      // If the product exists, update the cartQuantity
      user.cart[existingProductIndex].cartQuantity += cartQuantity || 1; // Increment cartQuantity
    } else {
      // If the product is not in the cart, push it to the cart array
      user.cart.push({
        productDetails: restProductDetails,
        cartQuantity: cartQuantity || 1, // Default to 1 if cartQuantity is not provided
      });
    }

    await user.save();

    res
      .status(200)
      .json({ message: "Product added to cart successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.deleteAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from the request

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Log the user's cart before clearing it
    console.log("User's cart before clearing:", user.cart);

    // Clear the cart array
    user.cart = [];

    // Save the updated user document
    await user.save();

    console.log("All cart items deleted successfully");

    // Respond with success message and updated user document
    res
      .status(200)
      .json({ message: "All cart items deleted successfully", user });
  } catch (error) {
    console.error("Error deleting all cart items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.IncreaseQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.productDetails.id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    user.cart[itemIndex].cartQuantity++;

    await user.save();

    res
      .status(200)
      .json({ message: "Cart quantity increased successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.DecreaseQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.productDetails.id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (user.cart[itemIndex].cartQuantity <= 1) {
      // If cart quantity is 1 or less, remove the item from the cart
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].cartQuantity--;
    }

    await user.save();

    res
      .status(200)
      .json({ message: "Cart quantity decreased successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getCart = async (req, res) => {
  try {
    console.log("Inside getCart function");

    const userId = req.user.id;
    const user = await User.findById(userId);
    console.log("UserID:", userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCart = user.cart;
    console.log("User Cart:", userCart);
    res
      .status(200)
      .json({ message: "User cart retrieved successfully", cart: userCart });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
exports.deleteCartItem = async (req, res) => {
  try {
    // Extract user ID and item ID from request parameters
    const userId = req.user.id;
    const itemIdToDelete = req.params.itemId;

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Debugging: Print user cart, item ID to delete, and all cart items
    console.log("User Cart:", user.cart);
    console.log("Item ID to Delete:", itemIdToDelete);
    console.log(
      "All Cart Items:",
      user.cart.map((item) => item.productDetails.id)
    );

    const itemIndex = user.cart.findIndex(
      (item) => String(item.productDetails.id) === String(itemIdToDelete)
    );

    // Check if the item is not found in the cart
    if (itemIndex === -1) {
      // Debugging: Print updated user cart for further analysis
      console.log("Updated User Cart:", user.cart);

      return res.status(404).json({ message: "Item not found in the cart" });
    }

    // Remove the item from the cart array
    user.cart.splice(itemIndex, 1);

    // Save the updated user document
    await user.save();

    // Debugging: Print updated user cart
    console.log("Updated User Cart:", user.cart);

    // Respond with success message and the updated cart
    res.status(200).json({
      message: "Item deleted from the cart successfully",
      cart: user.cart,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user by ID, populate the order history and coupon
    const user = await User.findById(userId)
      .populate("orderHistory")
      .populate({
        path: "coupon",
        match: { expirationDate: { $gte: new Date() } }, // Only populate valid coupons
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If the coupon is expired, remove it from the user's profile
    if (user.coupon && user.coupon.expirationDate < new Date()) {
      user.coupon = null;
      await user.save();
    }

    // If the user has a valid coupon, extract the code and store it in the profile
    if (user.coupon) {
      const couponCode = user.coupon.code; // Assuming 'code' is the property that holds the coupon code
      user.couponCode = couponCode; // Store the coupon code in a property of the user profile
      await user.save();
    }

    res
      .status(200)
      .json({ message: "User profile retrieved successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: "Email not found", emailFound: false });
    }

    // Generate a four-digit OTP
    const otp = generateFourDigitOTP();

    // Log the generated OTP
    console.log("Generated OTP:", otp);

    // Save the OTP to the user's document
    user.resetPasswordOTP = otp;
    await user.save(); // Make sure to save the user document

    // Send OTP via email
    const emailContent = `Your OTP for password reset is: ${otp}`;
    await sendOrderOTPEmailGmail(email, emailContent);

    res
      .status(200)
      .json({ message: "OTP sent successfully", emailFound: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
      emailFound: true,
    });
  }
};

exports.resendOTPS = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new four-digit OTP
    const newOTP = generateFourDigitOTP();

    // Update the user's resetPasswordOTP field with the new OTP
    user.resetPasswordOTP = newOTP;
    await user.save();

    // Send the new OTP via email
    const emailContent = `Your new OTP for password reset is: ${newOTP}`;
    await sendOrderOTPEmailGmail(email, emailContent);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
exports.resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Update the password
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Stored OTP:", user.resetPasswordOTP);
    console.log("Received OTP:", otp);

    // Check if the OTP matches after trimming and converting to string
    if (
      user.resetPasswordOTP &&
      user.resetPasswordOTP.toString().trim() === otp.trim()
    ) {
      // Clear the OTP field after successful OTP verification
      user.resetPasswordOTP = undefined;
      await user.save();

      res.status(200).json({ message: "OTP verified successfully" });
    } else {
      return res.status(401).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the order with the given orderId from the order history
    user.orderHistory = user.orderHistory.filter(
      (order) => order._id.toString() !== orderId
    );

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Order deleted successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.UserCartFind = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Fetch product details based on the productId
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Send the product details in the response
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getUserDetailsAndCoupon = async (req, res) => {
  try {
    // Extract user ID from the request
    const userId = req.user.id;

    // Find the user by ID and populate the coupon details
    const user = await User.findById(userId).populate("coupon");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user's name and email
    const { name, email } = user;

    // Extract coupon details if available
    let couponDetails = null;
    if (user.coupon) {
      couponDetails = {
        code: user.coupon.code,
        discount: user.coupon.discount,
        expirationDate: user.coupon.expirationDate,
      };
    }

    // Send the user's details and coupon details in the response
    res.status(200).json({ name, email, couponDetails });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_PASSWORD,
  },
});

const generateFiveDigitCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

exports.VerifyEmail = async (req, res) => {
  const email = req.body.email;

  // Generate a 5-digit code with letters and digits
  const verificationCode = generateFiveDigitCode();
  console.log(verificationCode);

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store the verification code in the user document
    user.verificationCode = verificationCode;
    await user.save();

    // Send the verification code via email
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Failed to send verification code");
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("Verification code sent successfully");
      }
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.VerifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the provided code matches the stored verification code
    if (user.verificationCode !== code) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // Clear the verification code after successful verification
    user.verificationCode = undefined;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.recommendProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user by ID and populate the order history
    const user = await User.findById(userId).populate("orderHistory");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract unique categories from the order history products
    const categories = user.orderHistory.flatMap((order) =>
      order.products.map((product) => product.category)
    );
    const uniqueCategories = [...new Set(categories)];

    // Find products with the same unique category and excluding products from the user's order history
    const recommendedProducts = await Product.find({
      category: { $in: uniqueCategories },
      _id: {
        $nin: user.orderHistory.flatMap((order) =>
          order.products.map((product) => product._id)
        ),
      },
    });

    // Extract unique descriptions from the order history products
    const descriptions = user.orderHistory.flatMap((order) =>
      order.products.map((product) => product.description)
    );
    const uniqueDescriptions = [...new Set(descriptions)];

    // Exclude products with descriptions that match those in the order history
    const productsToExclude = await Product.find({
      description: { $in: uniqueDescriptions },
    });

    const filteredProducts = recommendedProducts.filter(
      (product) =>
        !productsToExclude.some((excludedProduct) =>
          excludedProduct._id.equals(product._id)
        )
    );

    res.status(200).json({ recommendedProducts: filteredProducts });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Add to Wishlist API

// Delete from Wishlist API
// Delete from Wishlist API



exports.getUserOrderHistory = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the request body to see the ID
    const userId = req.params.userId;

    console.log("User:", req.user); // Log the user object

    // Find the user by ID and populate the orderHistory field with actual order documents
    const user = await User.findById(userId).populate("orderHistory");

    if (!user) {
      console.error("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Extract only the orderHistory from the populated user document
    const orderHistory = user.orderHistory || []; // If orderHistory is null or undefined, default to an empty array

    res.status(200).json(orderHistory);
  } catch (error) {
    console.error("Error fetching user order history:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.deleteUserOrderHistory = async (req, res) => {
  try {
   
    const userId = req.user.id;

    console.log("User:", req.user); // Log the user object

   
    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found");
      return res.status(404).json({ message: "User not found" });
    }

   
      // Clear the orderHistory array in the user document
      user.orderHistory = [];
      await user.save();
  

    res
      .status(200)
      .json({ message: "User order history deleted successfully" });
  } catch (error) {
    console.error("Error deleting user order history:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.postUserAddress = async (req, res) => {
  try {
    // Extract user ID from the request (assuming it's stored in req.user.id)
    const userId = req.user.id;

    // Retrieve address details from the request body
    const {
      email,
      firstName,
      lastName,
      country,
      address,
      city,
      postalCode,
      phoneNumber,
    } = req.body;

    // Create a new address object
    const newAddress = {
      email,
      firstName,
      lastName,
      country,
      address,
      city,
      postalCode,
      phoneNumber,
    };

    // Find the user by ID and push the new address to the addresses array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses.push(newAddress);

    // Save the updated user document
    await user.save();

    // Respond with the newly created address object
    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Error saving user address:", error);
    res.status(500).json({ error: "Failed to save user address" });
  }
};

exports.getUserAddresses = async (req, res) => {
  try {
    // Extract user ID from the request (assuming it's stored in req.user.id)
    const userId = req.user.id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the addresses array from the user document
    res.status(200).json(user.addresses);
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    res.status(500).json({ error: "Failed to fetch user addresses" });
  }
};

exports.deleteUserAddress = async (req, res) => {
  try {
    // Extract user ID from the request (assuming it's stored in req.user.id)
    const userId = req.user.id;
    console.log("Authenticated User ID:", userId); // Log the authenticated user ID

    // Extract address ID from the request parameters
    const addressId = req.params.addressId;
    console.log("Address ID to Delete:", addressId); // Log the address ID to be deleted

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the address exists in the user's addresses array
    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Remove the address from the user's addresses array
    user.addresses.splice(addressIndex, 1);

    // Save the updated user document
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting user address:", error);
    res.status(500).json({
      error: "Failed to delete user address. Internal server error occurred.",
    });
  }
};

exports.recommendProductsBasedOnOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from the request parameters

    // Find the user by ID and populate the orderHistory field with actual order documents
    const user = await User.findById(userId).populate("orderHistory");

    if (!user) {
      console.error("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Extract product IDs from the current user's order history
    const productIdsInOrderHistory = user.orderHistory.map(
      (order) => order.product
    );

    // If user has no order history, return an empty array of recommended products
    if (productIdsInOrderHistory.length === 0) {
      return res.status(200).json([]);
    }

    // Find categories of products in the current user's order history
    const categoriesInOrderHistory = await Product.distinct("category", {
      _id: { $in: productIdsInOrderHistory },
    });

    // Find products not present in the current user's order history
    const recommendedProducts = await Product.find({
      category: { $nin: categoriesInOrderHistory }, // Exclude categories present in user's order history
      _id: { $nin: productIdsInOrderHistory }, // Exclude products already in user's order history
    });

    res.status(200).json(recommendedProducts);
  } catch (error) {
    console.error(
      "Error recommending products based on order history:",
      error.message
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUserAddress = async (req, res) => {
  try {
    // Extract user ID from the request (assuming it's stored in req.user.id)
    const userId = req.user.id;
    console.log("Authenticated User ID:", userId); // Log the authenticated user ID

    // Extract address ID from the request parameters
    const addressId = req.params.addressId;
    console.log("Address ID to Update:", addressId); // Log the address ID to be updated

    // Extract updated address details from the request body
    const { city, postalCode, phoneNumber } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the address exists in the user's addresses array
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update specific fields of the address
    if (city) {
      address.city = city;
    }
    if (postalCode) {
      address.postalCode = postalCode;
    }
    if (phoneNumber) {
      address.phoneNumber = phoneNumber;
    }

    // Save the updated user document
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating user address:", error);
    res.status(500).json({
      error: "Failed to update user address. Internal server error occurred.",
    });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productDetails } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!productDetails || !productDetails._id) {
      return res.status(400).json({ message: "Invalid product details" });
    }

    const productId = productDetails._id;

    // Check if the product is already in the wishlist
    const productIndex = user.wishlist.findIndex(
      (item) => item._id.toString() === productId
    );

    if (productIndex !== -1) {
      // If the product exists, remove it
      user.wishlist.splice(productIndex, 1);
      await user.save();
      return res
        .status(200)
        .json({ message: "Product removed from wishlist", user });
    } else {
      // If the product does not exist, add it
      user.wishlist.push(productDetails);
      await user.save();
      return res
        .status(200)
        .json({ message: "Product added to wishlist", user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user.id;

    // Find the user by ID and populate the wishlist field
    const user = await User.findById(userId).populate("wishlist");

    // If user not found, return 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's wishlist
    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.removeFromWishlist = async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user.id;

    // Get the product ID to remove from the request body
    const { productId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);

    // If user not found, return 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the product exists in the user's wishlist
    const productIndex = user.wishlist.findIndex(
      (item) => item._id.toString() === productId
    );

    // If the product is not found in the wishlist, return 404 error
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    // Remove the product from the wishlist
    user.wishlist.splice(productIndex, 1);

    // Save the user object
    await user.save();

    // Return success message
    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
