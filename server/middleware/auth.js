// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Authentication required" });


    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
  next();
};

const ownerOnly = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      error: "Owner access required",
    });
  }
  next();
};
// Server-side auth.js route handler
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Send both token and user data in the response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedProperties: user.assignedProperties,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
// Update the checkRole middleware in server/middleware/auth.js
const checkRole = (roles) => {
  return (req, res, next) => {
    console.log("Checking role:", {
      userRole: req.user.role,
      requiredRoles: roles,
      hasAccess: roles.includes(req.user.role),
    });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
        userRole: req.user.role,
        requiredRoles: roles,
      });
    }
    next();
  };
};

module.exports = {
  auth,
  adminOnly,
  ownerOnly,
  checkRole,
};
