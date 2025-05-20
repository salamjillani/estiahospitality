const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Invoice = require("../models/Invoice");
const { generateInvoicePDF } = require("../services/pdfService");

exports.createBooking = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const status = isAdmin ? 'confirmed' : 'pending';
    
    const booking = await Booking.create({
      ...req.body,
      user: req.user._id,
      status: status,
    });

    const property = await Property.findById(booking.property)
      .select("pricePerNight bankDetails.currency")
      .lean();

    if (isAdmin) {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      const invoice = new Invoice({
        user: booking.user,
        booking: booking._id,
        property: booking.property,
        status: 'confirmed',
        paymentMethod: booking.paymentMethod,
        amounts: {
          total: booking.totalPrice,
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
          address: property.location?.address || "N/A",
          city: property.location?.city || "N/A",
          country: property.location?.country || "N/A",
        },
      });

      await invoice.save();
      booking.invoice = invoice._id;
      await booking.save();

      generateInvoicePDF(invoice)
        .then((pdfPath) => console.log(`Invoice PDF generated: ${pdfPath}`))
        .catch((err) => console.error("PDF generation failed:", err));
    }

    res.status(201).json({
      success: true,
      data: {
        booking,
        invoice: isAdmin ? {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          downloadLink: `/api/invoices/${invoice._id}/pdf`
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
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

exports.getClientBookings = async (req, res) => {
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

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    res.send(bookings);
  } catch (err) {
    res.status(500).send();
  }
};

