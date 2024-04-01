const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../model/admin.js'); // Make sure to provide the correct path
const config = require('../config');
const nodemailer = require("nodemailer");



async function sendOrderOTPEmailGmail(toEmail, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.myEmail, // Your Gmail address
        pass:config.myPassweord, // Your Gmail app password
      },
    });

    const info = await transporter.sendMail({
      from: config.myEmail,
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
// Multer middleware for handling form data

exports.adminSignUp = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      userName,
      email,
      password: hashedPassword,
      profile: {
        picture: "", // Initialize as empty string
        name: "", // Initialize to whatever default value you want
      },
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while registering admin" });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Email is incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    const token = jwt.sign({ email: admin.email, id: admin._id }, config.adminSecretKey, { expiresIn: '1h' });
    console.log(token);
    res.json({
      message: 'Authentication successful',
      token,
      admin: {
        email: admin.email,
        userName: admin.userName,
        id: admin._id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during admin authentication' });
  }
};
exports.updateAdminProfile = async (req, res) => {
  const { name, picture } = req.body;
  const adminId = req.admin.id;

  try {
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Save the picture data as a string directly in the database
    admin.profile.picture = picture;

    admin.profile.name = name;

    await admin.save();

    res.status(200).json({
      message: "Admin profile updated successfully",
      admin: admin.profile,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating admin profile" });
  }
};

exports.adminProfile = async(req,res)=>{
    try {
        const adminId = req.admin.id;
    
        // Find the admin by ID and exclude sensitive information like password
        const admin = await Admin.findById(adminId, '-password');
    
        if (!admin) {
          return res.status(404).json({ message: 'Admin not found' });
        }
    
        res.status(200).json({ message: 'Admin profile retrieved successfully', admin: admin.profile });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching admin profile' });
      }
}


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res
        .status(200)
        .json({ message: "Email not found", emailFound: false });
    }

    // Generate a four-digit OTP
    const otp = generateFourDigitOTP();

    // Log the generated OTP
    console.log("Generated OTP:", otp);

    // Save the OTP to the user's document
    admin.resetPasswordOTP = otp; // Assign OTP to resetPasswordOTP field
    await admin.save(); // Save the admin document with OTP

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
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Update the password
    const hashPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashPassword;

    await admin.save();

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
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    console.log("Stored OTP:", admin.resetPasswordOTP);
    console.log("Received OTP:", otp);

    // Check if the OTP exists and is a string before trimming
    if (
      admin.resetPasswordOTP &&
      typeof otp === 'string' &&
      admin.resetPasswordOTP.toString().trim() === otp.trim()
    ) {
      // Clear the OTP field after successful OTP verification
      admin.resetPasswordOTP = undefined;
      await admin.save();

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
