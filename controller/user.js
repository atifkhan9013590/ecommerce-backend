const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const config = require("../config");

const Product = require("../model/product");

const Coupon = require("../model/coupon");

const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

async function sendOrderOTPEmailGmail(toEmail, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "almarjan366@gmail.com", // Your Gmail address
        pass: "rzll zpcw vtkj fosi", // Your Gmail app password
      },
    });

    const info = await transporter.sendMail({
      from: "almarjan366@gmail.com",
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

async function sendWelcomeEmail(email, name) {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    // Configure your email service provider here
    service: "Gmail",
    auth: {
      user: "almarjan366@gmail.com", // Your Gmail address
      pass: "rzll zpcw vtkj fosi",
    },
  });

  // Email message options
  const mailOptions = {
    from: "almarjan366@gmail.com",
    to: email,
    subject: "Welcome to Marjan Store",
    text: `Hello ${name}, Welcome to Marjan Store! We are glad to have you onboard.`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}
exports.signUp = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const ifExistUser = await User.findOne({ email: email.toLowerCase() });
    if (ifExistUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: email.toLowerCase(),
      name,
      password: hashpassword,
    });
    await newUser.save();

    // Send welcome email to the user
    await sendWelcomeEmail(email.toLowerCase(), name);

    res.status(201).json({ message: "User Registered" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "An error occurred while registering" });
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

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Email is incorrect" });
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
      token: jwt.sign({ email: user.email, id: user._id }, config.secretKey, {
        expiresIn: "1h",
      }),
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
    user: "almarjan366@gmail.com",
    pass: "rzll zpcw vtkj fosi",
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
      from: "almarjan366@gmail.com",
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

    // Extract unique descriptions from the order history products
    const descriptions = user.orderHistory.flatMap((order) =>
      order.products.map((product) => product.description)
    );
    const uniqueDescriptions = [...new Set(descriptions)];

    // Find products with descriptions that match those in the order history
    const recommendedProducts = await Product.find({
      description: { $in: uniqueDescriptions },
    });

    res.status(200).json({ recommendedProducts });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.deleteAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the cart array
    user.cart = [];

    // Save the updated user document
    await user.save();

    res
      .status(200)
      .json({ message: "All cart items deleted successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
// Add to Wishlist API
exports.addToWishlist = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized - Invalid token or user information missing",
      });
    }

    // Extract user ID from the request
    const userId = req.user.id;

    // Extract product details from the request body
    const { productDetails } = req.body;

    // Validate product details
    if (!productDetails) {
      return res.status(400).json({ message: "Invalid product details" });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log('productDetails',productDetails);
    // Add the complete product details to the wishlist
    user.wishlist.push({ productDetails:productDetails});

    // Save the updated user document
    await user.save();

    // Respond with success message and updated user document
    res
      .status(200)
      .json({ message: "Product added to wishlist successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Delete from Wishlist API
// Delete from Wishlist API
exports.deleteFromWishlist = async (req, res) => {
  try {
    // Extract user ID from the request
    const userId = req.user.id;

    // Extract productId to delete from the request parameters
    const productIdToDelete = req.params.itemId; // Corrected parameter name

    console.log("productIdToDelete:", productIdToDelete); // Log the productIdToDelete

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the index of the item in the wishlist array based on productId
    const itemIndex = user.wishlist.findIndex(
      (item) => String(item.productDetails._id) === String(productIdToDelete)
    );

    // Check if the item exists in the wishlist
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    // Remove the item from the wishlist array
    user.wishlist.splice(itemIndex, 1);

    // Save the updated user document
    await user.save();

    // Respond with success message
    res
      .status(200)
      .json({ message: "Item deleted from wishlist successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.getWishlist = async (req, res) => {
  try {
    // Extract user ID from the request
    const userId = req.user.id;

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the user's wishlist
    console.log("User's wishlist:", user.wishlist);

    // Respond with the user's wishlist containing complete details of each item
    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
