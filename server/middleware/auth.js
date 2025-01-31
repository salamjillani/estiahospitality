// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Fix: Remove curly braces

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error("No token found");
      throw new Error("Authentication token missing");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.error("No user found for token");
      throw new Error("Invalid user");
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Please authenticate" });
  }
};

// Server-side auth.js route handler
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send both token and user data in the response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedProperties: user.assignedProperties
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
// Update the checkRole middleware in server/middleware/auth.js
const checkRole = (roles) => {
  return (req, res, next) => {
    console.log('Checking role:', {
      userRole: req.user.role,
      requiredRoles: roles,
      hasAccess: roles.includes(req.user.role)
    });
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied',
        userRole: req.user.role,
        requiredRoles: roles 
      });
    }
    next();
  };
};

module.exports = { auth, checkRole };
