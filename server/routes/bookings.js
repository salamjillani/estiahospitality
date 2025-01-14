// server/routes/bookings.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

// Get bookings for properties
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    
    // Property filter
    if (propertyId) {
      query.property = propertyId;
    } else if (req.user.role !== 'admin') {
      // Non-admin users can only see bookings for their assigned properties
      query.property = { $in: req.user.assignedProperties };
    }
    
    const bookings = await Booking.find(query)
      .populate('property')
      .sort({ startDate: 1 });
      
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !req.user.assignedProperties.includes(property._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const booking = new Booking({
      ...req.body,
      createdBy: req.user._id
    });
    
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;