// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Middleware to check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Register route
router.post('/register', async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
  
      // Validate input fields
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'All fields are required: name, email, and password' });
      }
  
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create new user
      user = new User({
        email,
        password,
        name,
        role: role || 'viewer',
      });
  
      await user.save();
  
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
  
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
  
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedProperties: user.assignedProperties
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

  router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Send response with both token and user data
        res.json({
            token, // Include token in response
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                assignedProperties: user.assignedProperties
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/logout', auth, async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

  // Get all non-admin users
  router.get('/users', auth, checkRole(['admin']), async (req, res) => {
    try {
      const users = await User.find({ role: { $ne: 'admin' } })
        .select('-password')
        .sort('name');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  module.exports = router;