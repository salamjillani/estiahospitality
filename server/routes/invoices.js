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

// Get all invoices (admin only)
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

// Get user invoices
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

    // Add more detailed logging
    console.log(`User ${req.user._id} requesting invoice ${invoiceId}`);

    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate({
        path: "property",
        select: "title location",
      })
      .populate({
        path: "booking",
        select:
          "checkInDate checkOutDate status rooms adults children nights paymentMethod phone guestName email totalPrice currency",
      });

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`);
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check authorization
    const isAuthorized =
      req.user.role === "admin" ||
      (invoice.user && invoice.user._id.toString() === req.user._id.toString());

    if (!isAuthorized) {
      console.warn(
        `Unauthorized access to invoice ${invoiceId} by user ${req.user._id}`
      );
      return res.status(403).json({ message: "Unauthorized" });
    }

    console.log(`Generating PDF for invoice ${invoice.invoiceNumber}`);

    // Ensure pdf service directory exists
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate PDF
    filePath = await generateInvoicePDF(invoice);
    console.log(`PDF generated at: ${filePath}`);

    if (!filePath || !fs.existsSync(filePath)) {
      console.error(`Generated PDF file not found at: ${filePath}`);
      return res.status(500).json({ message: "PDF generation failed" });
    }

    // Always set proper PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (err) => {
      console.error(`Error reading PDF file: ${err}`);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error reading PDF file" });
      }
    });

    // File cleanup after streaming is complete
    fileStream.on("close", () => {
      console.log(`PDF stream completed successfully for ${filePath}`);
      // Set a timeout to ensure the file isn't deleted too early
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Temp file deleted: ${filePath}`);
          }
        } catch (err) {
          console.error("Error deleting temp file:", err);
        }
      }, 1000); // 1 second delay to ensure stream completion
    });

    fileStream.pipe(res);
    fileStream.on('error', (err) => {
      console.error(`Error streaming PDF: ${err}`);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming PDF file" });
      }
    });
  } catch (err) {
    console.error("PDF generation error:", err);

    // Clean up the file if an error occurs and the file exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (deleteErr) {
        console.error("Error deleting temp file after error:", deleteErr);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
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
