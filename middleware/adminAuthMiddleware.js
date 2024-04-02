const jwt = require ('jsonwebtoken');

require("dotenv").config(); 

exports.adminAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = await jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    console.log('Decoded Payload:', decoded);
  
    req.admin = decoded;
    console.log('Admin Information:', req.admin);
  
    next();
  } catch (error) {
    console.error('Token Verification Error:', error);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};
