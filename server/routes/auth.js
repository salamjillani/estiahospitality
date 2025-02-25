// server/routes/auth.js
// server/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, adminOnly, ownerOnly } = require("../middleware/auth");

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Register route
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, secretKey } = req.body;
    const lowerEmail = email.toLowerCase();

    // Validate input fields
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "All fields are required: name, email, and password",
      });
    }

    let role = "client";
    if (secretKey === process.env.ADMIN_SECRET_KEY) role = "admin";
    else if (secretKey === process.env.OWNER_SECRET_KEY) role = "owner";

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      email: lowerEmail,
      password,
      name,
      role,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // false in development
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedProperties: user.assignedProperties,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/admin/register", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new admin user
    user = new User({
      email: lowerEmail,
      password,
      name,
      role,
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const lowerEmail = email.toLowerCase();

    // Find user - Use debug logging
    const user = await User.findOne({ email: lowerEmail });
    console.log("Login attempt:", {
      emailProvided: lowerEmail,
      userFound: !!user,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password - Add debug logging
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password check:", {
      isMatch,
      userEmail: user.email,
    });

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // Send response
    res.json({
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
    console.error("Server login error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all non-admin users
router.get("/users", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort("name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
