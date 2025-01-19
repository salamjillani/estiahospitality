// server/middleware/bookingValidation.js
const Booking = require('../models/Booking');

const validateBooking = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      property,
      guestName,
      numberOfGuests,
      pricePerNight,
      source
    } = req.body;

    // Check required fields
    if (!startDate || !endDate || !property || !guestName || !numberOfGuests || !pricePerNight) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['startDate', 'endDate', 'property', 'guestName', 'numberOfGuests', 'pricePerNight']
      });
    }

    // Basic date validation
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Validate numeric fields
    const price = parseFloat(pricePerNight);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Valid price per night is required' });
    }

    const guests = parseInt(numberOfGuests);
    if (isNaN(guests) || guests < 1) {
      return res.status(400).json({ message: 'Number of guests must be at least 1' });
    }

    // Validate source if provided
    if (source && !['direct', 'airbnb', 'booking.com', 'vrbo'].includes(source)) {
      return res.status(400).json({ 
        message: 'Invalid source. Must be one of: direct, airbnb, booking.com, vrbo' 
      });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      property,
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } },
        { startDate: { $gte: start, $lt: end } },
        { endDate: { $gt: start, $lte: end } }
      ],
      status: { $ne: 'cancelled' }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: 'This date range overlaps with an existing booking'
      });
    }

    // If validation passes, attach cleaned data to req
    req.validatedBooking = {
      property,
      startDate: start,
      endDate: end,
      guestName,
      numberOfGuests: guests,
      pricePerNight: price,
      source: source || 'direct'
    };

    next();
  } catch (error) {
    console.error('Booking validation error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { validateBooking };