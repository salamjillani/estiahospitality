const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = async (invoice) => {
  let writeStream = null;
  let doc = null;

  try {
    if (!invoice || !invoice.booking || !invoice.property) {
      throw new Error("Invoice missing required data");
    }

    console.log(
      "Creating PDF for invoice:",
      invoice.invoiceNumber || "unknown"
    );

    // Add fallbacks for missing data
    const user = invoice.user || {
      name: "Guest",
      email: "N/A",
      _id: "unknown",
    };

    const property = invoice.property || {
      title: "Unknown Property",
      _id: "unknown",
    };

    // Properly extract booking data with thorough null checks
    const booking = invoice.booking || {};

    // Validate essential invoice data
    if (!invoice.invoiceNumber) {
      console.warn("Missing invoice number, generating placeholder");
      invoice.invoiceNumber = `INV-${Date.now()}`;
    }

    if (!invoice.issuedDate) {
      console.warn("Missing issue date, using current date");
      invoice.issuedDate = new Date();
    }

    if (
      !invoice.amounts ||
      !invoice.amounts.total ||
      !invoice.amounts.currency
    ) {
      console.warn("Missing amount information, using defaults");
      invoice.amounts = invoice.amounts || {};
      invoice.amounts.total = invoice.amounts.total || 0;
      invoice.amounts.currency = invoice.amounts.currency || "USD";
    }

    // Create PDF document
    doc = new PDFDocument({ size: "A4", margin: 50 });

    // Ensure temp directory exists
    const tempPath = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }

    // Create a unique filename with timestamp to avoid conflicts
    const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    const filePath = path.join(tempPath, filename);

    // Create write stream
    writeStream = fs.createWriteStream(filePath);

    // Capture any write stream errors
    writeStream.on("error", (err) => {
      console.error(`Error writing to PDF file: ${err}`);
      throw new Error(`PDF stream write error: ${err.message}`);
    });

    doc.pipe(writeStream);

    // Improved logo path resolution
    const possibleLogoPaths = [
      path.join(__dirname, "../../public/logo.png"),
      path.join(__dirname, "../public/logo.png"),
      path.join(__dirname, "../frontend/public/logo.png"),
      path.join(__dirname, "../frontend/build/logo.png"),
      path.join(process.cwd(), "public/logo.png"),
    ];

    // Try each potential logo path
    let logoFound = false;
    for (const logoPath of possibleLogoPaths) {
      if (fs.existsSync(logoPath)) {
        console.log(`Logo found at: ${logoPath}`);
        doc.image(logoPath, 50, 45, { width: 50 });
        logoFound = true;
        break;
      }
    }

    if (!logoFound) {
      console.warn("Logo not found in any expected locations");
      doc.fontSize(20).text("INVOICE", 50, 45);
    }

    // Header
    doc.fontSize(20).text("Invoice", 50, 100);
    doc
      .fontSize(10)
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 130)
      .text(
        `Date: ${new Date(invoice.issuedDate).toLocaleDateString()}`,
        50,
        145
      )
      .text(`Status: ${invoice.status.toUpperCase()}`, 50, 160);

    // Customer Information
    doc
      .text(`Name: ${user.name || "Guest"}`, 300, 100)
      .text(`Email: ${user.email || "N/A"}`, 300, 115)
      .text(
        `Phone: ${invoice.guestDetails?.phone || booking.phone || "N/A"}`,
        300,
        130
      );

    // Booking Details
    const bookingTableTop = 200;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Property", 50, bookingTableTop)
      .text("Check-In", 200, bookingTableTop)
      .text("Check-Out", 300, bookingTableTop)
      .text("Total", 400, bookingTableTop)
      .font("Helvetica");

    doc
      .text(property.title || "Unknown Property", 50, bookingTableTop + 20)
      .text(
        booking.checkInDate
          ? new Date(booking.checkInDate).toLocaleDateString()
          : "N/A",
        200,
        bookingTableTop + 20
      )
      .text(
        booking.checkOutDate
          ? new Date(booking.checkOutDate).toLocaleDateString()
          : "N/A",
        300,
        bookingTableTop + 20
      )
      .text(
        `${invoice.amounts.total} ${invoice.amounts.currency}`,
        400,
        bookingTableTop + 20
      );

    // Guest Details - Prioritize guestDetails from invoice, then fall back to booking
    const rooms = invoice.guestDetails?.rooms || booking.rooms || "N/A";
    const nights =
      booking.nights ||
      calculateNights(booking.checkInDate, booking.checkOutDate) ||
      "N/A";
    const adults = invoice.guestDetails?.adults || booking.adults || "N/A";
    const children = invoice.guestDetails?.children || booking.children || 0;
    const paymentMethod =
      invoice.paymentMethod || booking.paymentMethod || "N/A";

    doc
      .text(`Rooms: ${rooms}`, 50, 250)
      .text(`Nights: ${nights}`, 150, 250)
      .text(`Adults: ${adults}`, 250, 250)
      .text(`Children: ${children}`, 350, 250);

    // Payment Method
    doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, 50, 280);

    // Footer
    doc.fontSize(10).text("Thank you for choosing our service!", 50, 700, {
      align: "center",
    });

    // End the document
    doc.end();

    console.log(`PDF generation started for: ${filePath}`);

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`PDF generation completed: ${filePath}`);
        resolve(filePath);
      });

      writeStream.on("error", (err) => {
        console.error(`PDF generation stream error: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error("PDF generation failed:", error);

    // Attempt to clean up if an error occurs
    if (doc) {
      try {
        doc.end();
      } catch (e) {
        console.error("Error ending PDF document:", e);
      }
    }

    throw error; // Re-throw to be handled by the caller
  }
};

// Helper function to calculate number of nights between two dates
function calculateNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return null;

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end - start);

  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

module.exports = { generateInvoicePDF };
