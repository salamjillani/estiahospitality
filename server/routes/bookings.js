const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { validateBooking } = require('../middleware/bookingValidation');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

// Get bookings with proper date handling and filtering
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;
    let query = {};
    
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    
    if (propertyId) {
      query.property = propertyId;
    } else if (req.user.role !== 'admin') {
      query.property = { $in: req.user.assignedProperties };
    }
    
    const bookings = await Booking.find(query)
      .populate({
        path: 'property',
        select: 'title identifier type'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .sort({ startDate: 1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking with validation
router.post('/', auth, validateBooking, async (req, res) => {
  try {
    const {
      property,
      startDate,
      endDate,
      guestName,
      numberOfGuests,
      pricePerNight,
      source
    } = req.body;
    

    // Validate required fields
    if (!property || !startDate || !endDate || !guestName || !numberOfGuests || !pricePerNight) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['property', 'startDate', 'endDate', 'guestName', 'numberOfGuests', 'pricePerNight']
      });
    }

    // Check property access
    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (req.user.role !== 'admin' && !req.user.assignedProperties.includes(propertyDoc._id)) {
      return res.status(403).json({ message: 'Access denied to this property' });
    }

    // Create new booking with all required fields
    const booking = new Booking({
      ...req.validatedBooking,
      createdBy: req.user._id,
      status: 'confirmed'
    });

    // Save booking
    await booking.save();

    // Return populated booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'property',
        select: 'title identifier type'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      });

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update booking status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('property');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (req.user.role !== 'admin' && !req.user.assignedProperties.includes(booking.property._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    booking.status = status;
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



module.exports = router;