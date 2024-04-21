const Coupon =require('../model/coupon.js');
const User =require('../model/user.js')
const nodemailer = require("nodemailer");
require("dotenv").config(); 

const sendEmailToUsers = async (coupon) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your Gmail address
        pass: process.env.MY_PASSWORD, // Your Gmail app password
      },
    });

    const users = await User.find(); // Fetch users from your database

    const promises = users.map(async (user) => {
      const info = await transporter.sendMail({
        from: process.env.MY_EMAIL,
        to: user.email,
        subject: "New Coupon Available!",
        text: `Hello ${user.name},\n\nA new coupon (${coupon.code}) is available. Get a ${coupon.discountPercentage}% discount on your purchases in category '${coupon.category}'.\n\nRegards,\nYour App Team`,
      });
      console.log("Email sent to:", user.email);
      return info;
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate, category } = req.body;

    // Validate required fields
    if (!code || !discountPercentage || !expirationDate) {
      return res.status(400).json({
        error: "Please provide code, discount percentage, and expiration date",
      });
    }

    // Create the coupon with specified fields
    const coupon = await Coupon.create({
      code,
      discountPercentage,
      expirationDate,
      category: category || [], // Set categories to an empty array if not provided
    });

    // Send email to users
    await sendEmailToUsers(coupon);

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getCoupon=async(req,res)=>{
  try {
    const coupons = await Coupon.find();

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({ error: 'No coupons found' });
    }

    res.status(200).json({ coupons });
  } catch (error) {
    console.error('Error getting coupons:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
let appliedCoupons = []; // Assuming this is a global variable to keep track of applied coupons

exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode, category } = req.body;

    // Check if the coupon has already been applied
    if (appliedCoupons.includes(couponCode)) {
      return res.status(400).json({ error: "Coupon has already been applied" });
    }

    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const currentDate = new Date();
    if (
      coupon.expirationDate &&
      currentDate > new Date(coupon.expirationDate)
    ) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    // Check if the coupon is applicable to any of the provided categories in the order detail
    let isApplicable = false;
    if (coupon.category && Array.isArray(coupon.category)) {
      for (const desc of category) {
        if (coupon.category.includes(desc)) {
          isApplicable = true;
          break;
        }
      }
    }

    if (!isApplicable) {
      return res.status(400).json({
        error: "Coupon is not applicable to any category in the order",
      });
    }

    // Mark the coupon as applied
    appliedCoupons.push(couponCode);

    // Return the coupon details
    res.status(200).json({ coupon });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.deleteCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCoupon = await Coupon.findOneAndDelete({ _id: id });

    if (!deletedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully', deletedCoupon });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Inside your server controller (couponController.js or similar)
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.status(200).json({ coupon });
  } catch (error) {
    console.error('Error getting coupon by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountPercentage, expirationDate, category } = req.body; // Change description to category
    console.log("Update coupon payload", req.body);

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { code, discountPercentage, expirationDate, category }, // Change description to category
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res
      .status(200)
      .json({ message: "Coupon updated successfully", updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
