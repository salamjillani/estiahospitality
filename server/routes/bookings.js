const express = require("express");
const router = express.Router();
const { auth, adminOnly, checkRole } = require("../middleware/auth");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

// Original admin route (keep for compatibility)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("property", "title")
      .populate("user", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// New admin dashboard route (all bookings)
router.get("/admin/dashboard", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("property", "title")
      .populate("user", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin bookings management (pending only)
router.get("/admin/bookings", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate("property", "title")
      .populate("user", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner bookings
router.get('/owner', auth, checkRole(['owner']), async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    const bookings = await Booking.find({ 
      property: { $in: properties.map(p => p._id) }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Client-specific bookings
router.get("/client/:userId", auth, checkRole(["client"]), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const bookings = await Booking.find({ user: req.params.userId }).populate("property");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create booking
router.post("/", auth, checkRole(["client"]), async (req, res) => {
  try {
    const property = await Property.findById(req.body.property)
      .select('pricePerNight bankDetails.currency')
      .lean();

    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (!property.bankDetails?.currency) {
      return res.status(400).json({ message: 'Property currency not configured properly' });
    }
  
    const requiredFields = [
      "property", "checkInDate", "checkOutDate", 
      "guestName", "email", "phone"
    ];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const startDate = new Date(req.body.checkInDate);
    const endDate = new Date(req.body.checkOutDate);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const booking = new Booking({
      ...req.body,
      totalPrice: nights * property.pricePerNight,
      currency: property.bankDetails.currency,
      pricePerNight: property.pricePerNight,
      user: req.user.id,
      status: "pending"
    });

    await booking.save();
    req.io.emit("newBooking", booking);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(400).json({ 
      message: err.message || 'Booking creation failed',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Update booking status
// Ensure proper population when updating booking status
router.patch("/:id", auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    .populate("property", "title")
    .populate("user", "name email");

    // Emit normalized booking data
    const bookingData = booking.toObject();
    bookingData.checkInDate = booking.checkInDate.toISOString();
    bookingData.checkOutDate = booking.checkOutDate.toISOString();
    
    req.io.emit("statusUpdate", bookingData);
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;