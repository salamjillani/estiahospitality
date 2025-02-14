// server/middleware/bookingValidation.js
const Booking = require('../models/Booking');

const validateBooking = async (req, res, next) => {
  try {
    const { startDate, endDate, property, guestName, numberOfGuests, pricePerNight } = req.body;

    // Basic validation checks
    if (!startDate || !endDate || !property || !guestName || !numberOfGuests || !pricePerNight) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['startDate', 'endDate', 'property', 'guestName', 'numberOfGuests', 'pricePerNight']
      });
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ message: 'End date must be after start date' });

    // Numeric validation
    if (parseFloat(pricePerNight) <= 0 || parseInt(numberOfGuests) < 1) {
      return res.status(400).json({ message: 'Invalid price or guest count' });
    }

    // Overlap check (exclude current booking during updates)
    const overlapQuery = {
      property,
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } },
        { startDate: { $gte: start, $lt: end } },
        { endDate: { $gt: start, $lte: end } }
      ],
      status: { $ne: 'cancelled' }
    };

    if (req.method === 'PUT' && req.params.id) {
      overlapQuery._id = { $ne: req.params.id };
    }

    const overlappingBooking = await Booking.findOne(overlapQuery);
    if (overlappingBooking) {
      return res.status(400).json({ message: 'Date range overlaps with existing booking' });
    }

    // Attach validated data
    req.validatedBooking = {
      property,
      startDate: start,
      endDate: end,
      guestName,
      numberOfGuests: parseInt(numberOfGuests),
      pricePerNight: parseFloat(pricePerNight),
      phone: req.body.phone,
      email: req.body.email,
      arrivalTime: req.body.arrivalTime,
      source: req.body.source
    };

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { validateBooking };