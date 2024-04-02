const jwt = require('jsonwebtoken');

const config = require('../config');
require("dotenv").config(); 

exports.authMiddleware = async (req, res, next) => {
const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = await jwt.verify(token, process.env.SECRET_KEY);
    console.log('Received Token:', token);
    console.log('Decoded Payload:', decoded);

    // Attach the decoded user information to the request for further use
    req.user = decoded;
    console.log('User Information:', req.user);
    next(); // Call the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};