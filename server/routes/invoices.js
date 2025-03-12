// routes/invoices.js
const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const { auth, checkRole, adminOnly } = require("../middleware/auth");
const { generateInvoicePDF } = require("../services/pdfService");
const fs = require("fs");
const path = require("path");

router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .populate("property", "title")
      .populate("booking", "status");

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin", auth, checkRole(["admin"]), async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .populate("property", "title")
      .populate("booking", "checkInDate checkOutDate status");
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("property", "title")
      .populate("booking", "checkInDate checkOutDate status");
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// routes/invoices.js
router.get("/:id/pdf", auth, async (req, res) => {
  let filePath = null;

  try {
    const invoiceId = req.params.id;
    console.log(`PDF request for invoice: ${invoiceId}`);

    // Initial minimal fetch for authorization check
    const basicInvoice = await Invoice.findById(invoiceId)
      .populate("user", "_id");

    // Handle missing invoice immediately
    if (!basicInvoice) {
      return res.status(404)
        .set("Content-Type", "application/json")
        .json({ message: "Invoice not found" });
    }

    // Strict authorization check
    const isAuthorized = req.user.role === "admin" || 
      (basicInvoice.user && basicInvoice.user._id.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403)
        .set("Content-Type", "application/json")
        .json({ message: "Unauthorized access to this invoice" });
    }

    // Full population for PDF generation
    const fullInvoice = await Invoice.findById(invoiceId)
      .populate({
        path: "user",
        select: "name email phone"
      })
      .populate({
        path: "property",
        select: "title location"
      })
      .populate({
        path: "booking",
        select: "reservationCode checkInDate checkOutDate status totalPrice currency paymentMethod rooms adults children phone user property guestName email"
      });

    // Validate required relationships
    const missingRelations = [];
    if (!fullInvoice.user) missingRelations.push("user");
    if (!fullInvoice.property) missingRelations.push("property");
    if (!fullInvoice.booking) missingRelations.push("booking");

    if (missingRelations.length > 0) {
      console.error(`Missing required relations: ${missingRelations.join(", ")}`);
      return res.status(400)
        .set("Content-Type", "application/json")
        .json({
          message: "Invoice data incomplete",
          missing: missingRelations,
        });
    }

    // Generate PDF
    try {
      filePath = await generateInvoicePDF(fullInvoice);
    } catch (genError) {
      console.error(`PDF generation failed: ${genError.message}`);
      return res.status(500)
        .set("Content-Type", "application/json")
        .json({
          message: "PDF generation failed",
          detail: genError.message,
        });
    }

    // Verify PDF exists
    if (!fs.existsSync(filePath)) {
      console.error(`Generated PDF missing: ${filePath}`);
      return res.status(500)
        .set("Content-Type", "application/json")
        .json({ message: "PDF file not created" });
    }

    // Set PDF headers only after all validations
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fullInvoice.invoiceNumber || "invoice"}.pdf"`
    );

    // Stream with cleanup
    const fileStream = fs.createReadStream(filePath)
      .on("open", () => console.log(`Streaming PDF: ${filePath}`))
      .on("error", (streamError) => {
        console.error(`Stream error: ${streamError.message}`);
        if (!res.headersSent) {
          res.status(500)
            .set("Content-Type", "application/json")
            .json({ message: "Error streaming PDF" });
        }
      })
      .on("end", () => {
        console.log(`Completed streaming: ${filePath}`);
        // Delayed cleanup to ensure file is released
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (unlinkError) => {
              if (unlinkError) console.error(`Cleanup failed: ${unlinkError}`);
              else console.log(`Temp file cleaned: ${filePath}`);
            });
          }
        }, 5000);
      });

    fileStream.pipe(res);

  } catch (err) {
    console.error(`PDF endpoint error: ${err.message}`);

    // Cleanup temp file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (unlinkError) => {
        if (unlinkError) console.error(`Error cleanup failed: ${unlinkError}`);
      });
    }

    // Handle specific error types
    if (!res.headersSent) {
      const statusCode = err.name === "CastError" ? 400 : 500;
      res.status(statusCode)
        .set("Content-Type", "application/json")
        .json({
          message: "Invoice processing failed",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
  }
});
// Add this route to invoices.js
router.post("/generate/:bookingId", auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("property")
      .populate("user");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ booking: booking._id });

    if (invoice) {
      return res.status(400).json({
        message: "Invoice already exists",
        invoiceId: invoice._id,
      });
    }

    // Create new invoice
    invoice = new Invoice({
      user: booking.user._id,
      booking: booking._id,
      property: booking.property._id,
      status: booking.status,

      amounts: {
        total: booking.totalPrice,
        currency: booking.currency || "USD",
      },
      paymentMethod: booking.paymentMethod || "cash",
    });

    await invoice.save();

    // Update booking with invoice reference
    booking.invoice = invoice._id;
    await booking.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
