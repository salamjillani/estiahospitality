// routes/bookings.js
const express = require("express");
const router = express.Router();
const { auth, adminOnly, checkRole } = require("../middleware/auth");
const Booking = require("../models/Booking");

// Admin routes
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

// server/routes/bookings.js
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

// Client-specific routes
router.get("/client/:userId", auth, checkRole(["client"]), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const bookings = await Booking.find({ user: req.params.userId }).populate(
      "property"
    );
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Client booking creation
router.post("/", auth, checkRole(["client"]), async (req, res) => {
  try {
    const requiredFields = ["property", "checkInDate", "checkOutDate"];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const booking = new Booking({
      ...req.body,
      user: req.user.id,
      status: "pending",
    });

    await booking.save();
    req.io.emit("newBooking", booking);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin status update
router.patch("/:id", auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("property user");

    req.io.emit("bookingUpdate", booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



module.exports = router;
