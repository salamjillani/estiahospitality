// controllers/bookingController.js
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Invoice = require("../models/Invoice");
const { generateInvoicePDF } = require("../services/pdfService");

exports.createBooking = async (req, res) => {
  try {
    // Create booking from validated request body
    const booking = await Booking.create({
      ...req.body,
      user: req.user._id,
      status: "pending",
    });

    // Get property details for invoice snapshot
    const property = await Property.findById(booking.property)
      .select("title location.pricePerNight bankDetails.currency")
      .lean();

      if (!property.bankDetails?.currency) {
        throw new Error("Property currency configuration is invalid");
      }

    if (!property) {
      throw new Error("Property not found");
    }

    // Calculate nights and price
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Create invoice with snapshot data
    const invoice = new Invoice({
      user: booking.user,
      booking: booking._id,
      property: booking.property,
      status: booking.status,
      paymentMethod: booking.paymentMethod,
      amounts: {
        total: nights * property.pricePerNight,
        currency: property.bankDetails.currency,
      },
      guestDetails: {
        name: booking.guestName,
        email: booking.email,
        phone: booking.phone,
        nationality: booking.nationality,
        rooms: booking.rooms,
        adults: booking.adults,
        children: booking.children,
      },
      propertyDetails: {
        title: property.title,
        address: property.location?.address || "Not specified",
        city: property.location?.city || "Not specified",
        country: property.location?.country || "Not specified",
      },
    });

    await invoice.save();
    booking.invoice = invoice._id;
    await booking.save();

    // Generate PDF (async - don't await)
    generateInvoicePDF(invoice)
      .then((pdfPath) => {
        console.log(`Invoice PDF generated: ${pdfPath}`);
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
      });

    // Send response with booking and invoice data
    res.status(201).json({
      success: true,
      data: {
        booking,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          downloadLink: `/api/invoices/${invoice._id}/pdf`
        }
      }
    });
  } catch (error) {
    if (booking) await Booking.findByIdAndDelete(booking._id);
    res.status(400).json({ error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("property user");

    // Emit real-time update
    req.io.emit("bookingUpdate", booking);

    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.params.userId,
      status: { $ne: "deleted" },
    });
    res.send(bookings);
  } catch (err) {
    res.status(500).send();
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    res.send(bookings);
  } catch (err) {
    res.status(500).send();
  }
};

