// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Fix: Remove curly braces

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token found');
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      console.log('No user found for token');
      throw new Error();
    }

    console.log('Authenticated user:', { 
      id: user._id, 
      role: user.role, 
      name: user.name 
    }); 


    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.log('Auth error:', error.message);
    res.status(401).json({ message: 'Please authenticate' });
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

