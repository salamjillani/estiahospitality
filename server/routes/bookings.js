// server/routes/bookings.js
const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const { validateBooking } = require("../middleware/bookingValidation");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const BookingAgent = require("../models/BookingAgent");

const defaultCommissions = {
  direct: 0,
  airbnb: 12,
  "booking.com": 15,
  vrbo: 8,
};

const getCommission = async (source) => {
  if (defaultCommissions.hasOwnProperty(source)) {
    return defaultCommissions[source];
  }

  const agent = await BookingAgent.findOne({ name: source });
  if (!agent) throw new Error("Invalid booking source");
  return agent.commissionPercentage;
};

// GET all bookings
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, propertyId, user } = req.query;
    let query = {};

    // Authorization logic
    if (req.user.role !== 'admin') {
      // For non-admins, only show their own bookings
      query.createdBy = req.user._id; 
      
      // If they have assigned properties, show those property's bookings
      if (req.user.assignedProperties?.length) {
        query.$or = [
          { createdBy: req.user._id },
          { property: { $in: req.user.assignedProperties } }
        ];
      }
    } else {
      // Admin can filter by user if specified
      if (user) query.createdBy = user;
    }

    // Add date filters
    if (startDate && endDate) {
      query.$or = [
        { startDate: { $lt: new Date(endDate) } },
        { endDate: { $gt: new Date(startDate) } },
      ];
    }

    // Add property filter
    if (propertyId) query.property = propertyId;

    const bookings = await Booking.find(query)
      .populate({
        path: "property",
        select: "title identifier type photos location",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate('property createdBy')
      .sort({ startDate: 1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create booking
router.post("/", auth, validateBooking, async (req, res) => {
  try {
    const commissionPercentage = await getCommission(req.body.source);
    const property = await Property.findById(req.validatedBooking.property);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const booking = new Booking({
      ...req.validatedBooking,
      commissionPercentage,
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

      const notification = new Notification({
        type: "booking-request",
        booking: booking._id,
        message: `New booking from ${req.user.name}`,
        status: "pending"
      });
      await notification.save();
  
      // Broadcast via WebSocket
      req.app.locals.broadcast('new_booking', notification);

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(400).json({
      message: error.message.includes("Invalid booking source")
        ? "Invalid booking source - please select a valid agent"
        : error.message,
    });
  }
});

// PUT update booking
router.put("/:id", auth, validateBooking, async (req, res) => {
  try {
    const commissionPercentage = await getCommission(req.body.source);
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Property access check
    const property = await Property.findById(req.validatedBooking.property);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(property._id)
    ) {
      return res
        .status(403)
        .json({ message: "Access denied to this property" });
    }

    booking.set({
      ...req.validatedBooking,
      commissionPercentage,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate(
      "property createdBy"
    );

    res.json(populatedBooking);
  } catch (error) {
    res.status(400).json({
      message: error.message.includes("Invalid booking source")
        ? "Invalid booking source - please select a valid agent"
        : error.message,
    });
  }
});

// DELETE booking
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("property");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      req.user.role !== "admin" &&
      !req.user.assignedProperties.includes(booking.property._id)
    ) {
      return res.status(403).json({ message: "Access denied to this booking" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking deletion error:", error);
    res.status(400).json({ message: error.message });
  }
});

// PATCH update booking status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true } // This ensures the updated document is returned
    ).populate('property');

    // Create notification
    const notification = new Notification({
      type: "status_update",
      booking: booking._id,
      message: `Booking status updated to ${req.body.status}`,
      recipient: booking.user,
    });
    await notification.save();

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
