const express = require("express");
const router = express.Router();
const { auth, adminOnly, checkRole } = require("../middleware/auth");
const bookingController = require("../controllers/bookingController");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Invoice = require("../models/Invoice");
const Counter = require("../models/Counter");
const mongoose = require("mongoose");

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

router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["pending", "confirmed", "cancelled"] },
    })
      .populate({
        path: "invoice",
        populate: {
          path: "user property booking",
          select: "name email title checkInDate checkOutDate",
        },
      })
      .populate("bookingAgent", "name commissionPercentage")
      .populate("property", "title")
      .populate("user", "name email")
      .populate({
        path: "statusHistory.changedBy",
        select: "name email",
      });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/bookings", auth, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "invoice",
        select: "_id invoiceNumber status issuedDate", // Ensure correct fields
      })
      .populate("property", "title pricePerNight")
      .populate("user", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner bookings
router.get("/owner", auth, checkRole(["owner"]), async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    const bookings = await Booking.find({
      property: { $in: properties.map((p) => p._id) },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/client/:userId", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Allow clients to access only their own bookings, but admins can access any client's bookings
    if (
      req.user.role === "client" &&
      req.user._id.toString() !== req.params.userId
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const bookings = await Booking.find({ user: req.params.userId })
      .populate("property", "title location pricePerNight")
      .populate("bookingAgent", "name")
      .populate({
        path: "invoice",
        populate: [
          { path: "user", select: "name email phone" },
          { path: "property", select: "title location" },
          {
            path: "booking",
            select: "checkInDate checkOutDate rooms adults children",
          },
        ],
      });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching client bookings:", err);
    res.status(500).json({ message: err.message });
  }
});


router.get("/:id/pdf", auth, async (req, res) => {
  try {
    console.log(`Generating PDF for invoice ID: ${req.params.id}`);
    const invoice = await Invoice.findById(req.params.id)
      .populate("user")
      .populate("property")
      .populate("booking");

    if (!invoice) {
      console.error(`Invoice not found: ${req.params.id}`);
      return res.status(404).json({ message: "Invoice not found" });
    }

    console.log(`Found invoice ${invoice.invoiceNumber}, generating PDF...`);
    const filePath = await generateInvoicePDF(invoice);

    // Proper PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Cleanup after stream finishes
    fileStream.on("end", () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/property/:propertyId", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ property: req.params.propertyId })
      .populate("user", "name email")
      .populate("property", "title");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create booking
router.post("/", auth, checkRole(["client", "admin"]),validateBooking, async (req, res) => {
  try {
    const initialStatus = req.user.role === "admin" ? "confirmed" : "pending";
    
    const property = await Property.findById(req.body.property)
      .select("pricePerNight bankDetails.currency rooms guestCapacity title location")
      .lean();
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!req.body.totalPrice || typeof req.body.totalPrice !== "number") {
      return res.status(400).json({ message: "Invalid price calculation" });
    }
    if (typeof property.pricePerNight !== "number" || isNaN(property.pricePerNight)) {
      return res.status(400).json({ 
        message: "Property pricing configuration error: Invalid pricePerNight" 
      });
    }
    if (!property.bankDetails?.currency) {
      return res.status(400).json({ message: "Property currency not configured properly" });
    }

    // Room availability check
    if (req.body.rooms > property.rooms) {
      return res.status(400).json({ message: `Only ${property.rooms} rooms available` });
    }
    if (req.body.adults + req.body.children > property.guestCapacity) {
      return res.status(400).json({
        message: `Exceeds maximum occupancy of ${property.guestCapacity} people`,
      });
    }

    // Date conflict check
    const existingBookings = await Booking.find({
      property: req.body.property,
      status: { $nin: ["cancelled", "rejected"] },
      $or: [
        {
          checkInDate: { $lt: new Date(req.body.checkOutDate) },
          checkOutDate: { $gt: new Date(req.body.checkInDate) },
        },
      ],
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: "Property already booked for these dates" });
    }

    const requiredFields = [
      "property",
      "checkInDate",
      "checkOutDate",
      "guestName",
      "email",
      "phone",
    ];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const startDate = new Date(req.body.checkInDate);
    const endDate = new Date(req.body.checkOutDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid dates provided" });
    }

    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (isNaN(nights) || nights <= 0) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const booking = new Booking({
      ...req.body,
      totalPrice: req.body.totalPrice,
      currency: property.bankDetails.currency,
      pricePerNight: property.pricePerNight,
      bookingAgent: req.body.bookingAgent || undefined,
      commissionPercentage: req.body.commissionPercentage || 0,
      paymentMethod: req.body.paymentMethod,
      user: req.user.id,
      status: initialStatus,
    });

    await booking.save();

    // Generate invoice for admin-confirmed bookings
    let invoice = null;
    if (initialStatus === "confirmed") {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const counter = await Counter.findOneAndUpdate(
        { _id: "invoiceNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const invoiceNumber = `INV-${year}${month}-${String(counter.seq).padStart(4, "0")}`;

      invoice = new Invoice({
        invoiceNumber,
        user: booking.user,
        booking: booking._id,
        property: booking.property,
        issuedDate: new Date(),
        dueDate: new Date(booking.checkInDate),
        status: "confirmed",
        amounts: {
          total: booking.totalPrice,
          currency: booking.currency,
        },
        paymentMethod: booking.paymentMethod,
        guestDetails: {
          name: booking.guestName,
          email: booking.email,
          phone: booking.phone,
          rooms: booking.rooms,
          adults: booking.adults,
          children: booking.children,
        },
        commission: {
          agent: booking.bookingAgent,
          percentage: booking.commissionPercentage,
          amount: booking.totalPrice * (booking.commissionPercentage / 100),
        },
        propertyDetails: {
          title: property.title,
          address: property.location?.address || "N/A",
          city: property.location?.city || "N/A",
          country: property.location?.country || "N/A",
        },
      });

      await invoice.save();
      booking.invoice = invoice._id;
      await booking.save();
    }

    // Populate booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "name email")
      .populate("property", "title pricePerNight")
      .populate("invoice", "invoiceNumber status");

    req.io.emit("newBooking", populatedBooking);
    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(400).json({
      message: err.message || "Booking creation failed",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.patch("/:id", auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("property", "title pricePerNight");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const property = await Property.findById(booking.property);

    if (req.body.rooms && req.body.rooms > property.rooms) {
      return res
        .status(400)
        .json({ message: `Exceeds available rooms (${property.rooms})` });
    }

    // Validate status transition
    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot modify cancelled bookings" });
    }

    // Update booking status and history
    booking.status = req.body.status;
    booking.statusHistory.push({
      status: req.body.status,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    // Handle invoice creation for confirmed bookings
    if (req.body.status === "confirmed" && !booking.invoice) {
      // Generate a unique invoice number using Counter model
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      // Use findOneAndUpdate with upsert to atomically increment the counter
      const counter = await Counter.findOneAndUpdate(
        { _id: "invoiceNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const invoiceNumber = `INV-${year}${month}-${String(counter.seq).padStart(
        4,
        "0"
      )}`;

      // Check if invoice with this number already exists (double safety)
      const existingInvoice = await Invoice.findOne({ invoiceNumber });
      if (existingInvoice) {
        return res.status(400).json({
          message: "Invoice number generation conflict. Please try again.",
        });
      }

      const invoice = new Invoice({
        invoiceNumber,
        user: booking.user._id,
        booking: booking._id,
        property: booking.property._id,
        issuedDate: new Date(),
        dueDate: new Date(booking.checkInDate),
        status: "confirmed",
        amounts: {
          total: booking.totalPrice,
          currency: booking.currency || "USD",
        },
        paymentMethod: booking.paymentMethod,
        guestDetails: {
          name: booking.guestName,
          email: booking.email,
          phone: booking.phone,
          rooms: booking.rooms,
          adults: booking.adults,
          children: booking.children,
        },
        commission: {
          agent: booking.bookingAgent,
          percentage: booking.commissionPercentage,
          amount: booking.totalPrice * (booking.commissionPercentage / 100)
        },
        propertyDetails: {
          title: booking.property.title,
          address: booking.property.location?.address || "N/A",
          city: booking.property.location?.city || "N/A",
          country: booking.property.location?.country || "N/A",
        },
      });

      await invoice.save();
      booking.invoice = invoice._id;
      await booking.save();
    }

    // Save updated booking
    const updatedBooking = await booking.save();
    req.io.emit("bookingUpdate", updatedBooking);

    // Populate relationships for response
    await updatedBooking.populate([
      { path: "user", select: "name email" },
      { path: "property", select: "title pricePerNight" },
      { path: "invoice", select: "invoiceNumber status" },
    ]);

    // Update invoice status if exists
    if (updatedBooking.invoice) {
      await Invoice.findByIdAndUpdate(updatedBooking.invoice._id, {
        status: updatedBooking.status,
        $push: {
          statusHistory: {
            status: updatedBooking.status,
            changedAt: new Date(),
            changedBy: req.user._id,
          },
        },
      });
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error("Booking update error:", err);
    res.status(500).json({
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.patch("/client/:id", auth, checkRole(["client"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    const property = await Property.findById(req.body.property);

    if (req.body.rooms > property.bedrooms) {
      return res.status(400).json({
        message: `Only ${property.bedrooms} rooms available`,
      });
    }
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
        $push: {
          statusHistory: {
            status: "cancelled",
            changedAt: new Date(),
            changedBy: req.user._id,
          },
        },
      },
      { new: true }
    )
      .populate({
        path: "statusHistory.changedBy",
        select: "name email",
      })
      .populate("property", "title")
      .populate("user", "name email");
    req.io.emit("statusUpdate", updatedBooking);
    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
