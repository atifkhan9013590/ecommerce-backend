const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { unlink } = require("fs-extra");


const Admin = require('../model/admin.js'); // Make sure to provide the correct path

const nodemailer = require("nodemailer");
require("dotenv").config(); 



async function sendOrderOTPEmailGmail(toEmail, content) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL, // Your Gmail address
        pass:process.env.MY_PASSWORD, // Your Gmail app password
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

exports.getAdminProfile = async (req, res) => {
  try {
    // Fetch admin profile based on admin ID
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }
    res.json(admin);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching admin profile" });
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

    const token = jwt.sign(
      { email: admin.email, id: admin._id },
      process.env.ADMIN_SECRET_KEY,
      { expiresIn: "1h" }
    );
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
        .status(401)
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

exports.updateAdminProfile = async (req, res) => {
  const { userName, email } = req.body;
  const adminId = req.admin.id;

  try {
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update username if provided
    if (userName) {
      admin.userName = userName;
    }

    // Update email if provided
    if (email) {
      // Check if the new email is already taken
      const existingAdmin = await Admin.findOne({ email });
      if (
        existingAdmin &&
        existingAdmin._id.toString() !== admin._id.toString()
      ) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      admin.email = email;
    }

    await admin.save();

    res.status(200).json({
      message: "Admin profile updated successfully",
      admin: { userName: admin.userName, email: admin.email },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating admin profile" });
  }
};



exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      admin.password
    );
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    // Update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


exports.ResendOtp =async (req,res) => {
 const { email } = req.body;

 try {
   const admin = await Admin.findOne({ email });

   if (!admin) {
     return res
       .status(401)
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

   res.status(200).json({ message: "OTP sent successfully", emailFound: true });
 } catch (error) {
   console.error(error);
   res.status(500).json({
     message: "Internal Server Error",
     error: error.message,
     emailFound: true,
   });
 }
}


exports.uploadProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({
        message: "Bad Request - Profile picture file is missing",
      });
    }

    // Extract admin ID from decoded token
    const adminId = req.admin.id;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update the profilePicture field with the base64 image data
    admin.profilePicture = profilePicture;

    // Save the updated admin document
    await admin.save();

    res.status(200).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    // Get the admin ID from request body or token (depending on your authentication mechanism)
    const adminId = req.admin.id; // Assuming admin ID is provided in request body

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Send the profile picture path in the response
    res.status(200).json({ profilePicture: admin.profilePicture });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    // Check for validation errors
 const { profilePicture } = req.body;
    // Check if the profile picture is present in the request body
    if (!profilePicture) {
      return res.status(400).json({
        message: "Bad Request - Profile picture file is missing",
      });
    }

    // Extract admin ID from decoded token
    const adminId = req.admin.id;

    // Find the admin by ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // If admin already has a profile picture, update it
    if (admin.profilePicture) {
      // Update the profilePicture field with the path to the uploaded image
      admin.profilePicture = profilePicture;
    } else {
      // If admin does not have a profile picture, set the new one
      admin.profilePicture = profilePicture;
    }

    // Save the updated admin document
    await admin.save();

    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
