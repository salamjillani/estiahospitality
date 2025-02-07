const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const { validateBooking } = require("../middleware/bookingValidation");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (propertyId) {
      query.property = propertyId;
    } else if (req.user.role !== "admin") {
      query.property = { $in: req.user.assignedProperties };
    }

    const bookings = await Booking.find(query)
      .populate({
        path: "property",
        select: "title identifier type photos",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .sort({ startDate: 1 });

    // Wrap bookings in an object
    res.json({ bookings });  // Changed this line
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking with validation
router.post("/", auth, validateBooking, async (req, res) => {
  try {
    const {
      property,
      startDate,
      endDate,
      guestName,
      numberOfGuests,
      pricePerNight,
      source,
    } = req.body;

    // Validate required fields
    if (
      !property ||
      !startDate ||
      !endDate ||
      !guestName ||
      !numberOfGuests ||
      !pricePerNight
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "property",
          "startDate",
          "endDate",
          "guestName",
          "numberOfGuests",
          "pricePerNight",
        ],
      });
    }

    // Check property access
    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(propertyDoc._id)
    ) {
      return res
        .status(403)
        .json({ message: "Access denied to this property" });
    }

    const booking = new Booking({
      ...req.validatedBooking,
      createdBy: req.user._id,
      status: "confirmed",
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "property",
        select: "title identifier type",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      });

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Add PUT route for updating bookings
router.put("/:id", auth, validateBooking, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const {
      property,
      startDate,
      endDate,
      guestName,
      numberOfGuests,
      pricePerNight,
      source,
    } = req.body;

    // Check if booking exists
    const existingBooking = await Booking.findById(bookingId).populate(
      "property"
    );

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check property access
    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(existingBooking.property._id)
    ) {
      return res.status(403).json({ message: "Access denied to this booking" });
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        ...req.validatedBooking,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate({
        path: "property",
        select: "title identifier type",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      });

    res.json(updatedBooking);
  } catch (error) {
    console.error("Booking update error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Add DELETE route for removing bookings
router.delete("/:id", auth, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Check if booking exists
    const booking = await Booking.findById(bookingId).populate("property");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check property access
    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(booking.property._id)
    ) {
      return res.status(403).json({ message: "Access denied to this booking" });
    }

    // Delete booking
    await Booking.findByIdAndDelete(bookingId);

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking deletion error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update booking status (keep existing route)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(booking.property._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
