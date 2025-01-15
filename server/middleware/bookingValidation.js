// server/middleware/bookingValidation.js
const Booking = require('../models/Booking');

const validateBooking = async (req, res, next) => {
  try {
    const { startDate, endDate, property } = req.body;
    
    // Basic date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
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
    
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { validateBooking };