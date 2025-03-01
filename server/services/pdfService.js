const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = async (invoice) => {
  let writeStream = null;
  let doc = null;

  try {
    if (!invoice || !invoice.booking || !invoice.property || !invoice.user) {
      console.error("Missing core invoice relationships:", {
        booking: !!invoice?.booking,
        property: !!invoice?.property,
        user: !!invoice?.user,
      });
      throw new Error("Invoice missing required relationships");
    }

    console.log(
      "Creating PDF for invoice:",
      invoice.invoiceNumber || "unknown",
      "with booking data:",
      {
        checkIn: invoice.booking?.checkInDate || "missing",
        checkOut: invoice.booking?.checkOutDate || "missing",
        guest: invoice.booking?.guestName || invoice.user?.name || "missing",
      }
    );

    // Add fallbacks for missing data with improved access patterns
    const user = invoice.user || {
      name: invoice.booking?.guestName || "Guest",
      email: invoice.booking?.email || "N/A",
      _id: "unknown",
    };

    const property = invoice.property || {
      title: "Unknown Property",
      _id: "unknown",
    };

    // Properly extract booking data with thorough null checks
    const booking = invoice.booking || {};

    // Extract email from either guestDetails (if present) or directly from booking or user
    const email =
      invoice.guestDetails?.email || booking.email || user.email || "N/A";
    const phone = invoice.guestDetails?.phone || booking.phone || "N/A";

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
      invoice.amounts.total = invoice.amounts.total || booking.totalPrice || 0;
      invoice.amounts.currency =
        invoice.amounts.currency || booking.currency || "USD";
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

    // UPDATED: Improved logo path resolution with more paths for your specific structure
    const possibleLogoPaths = [
      // From server directory to frontend/public
      path.join(__dirname, "../frontend/public/logo.png"),
      // From a subdirectory in server to frontend/public
      path.join(__dirname, "../../frontend/public/logo.png"),
      // From server root to frontend/public
      path.join(path.dirname(require.main.filename), "../frontend/public/logo.png"),
      // Absolute path using process.cwd() (project root)
      path.join(process.cwd(), "frontend/public/logo.png"),
      // Original paths as fallback
      path.join(__dirname, "../../public/logo.png"),
      path.join(__dirname, "../public/logo.png"),
      path.join(__dirname, "../frontend/build/logo.png"),
      path.join(process.cwd(), "public/logo.png"),
    ];

    // Try each potential logo path
    let logoFound = false;
    for (const logoPath of possibleLogoPaths) {
      try {
        if (fs.existsSync(logoPath)) {
          console.log(`Logo found at: ${logoPath}`);
          doc.image(logoPath, 50, 45, { width: 50 });
          logoFound = true;
          break;
        }
      } catch (err) {
        console.warn(`Error checking logo path ${logoPath}:`, err.message);
      }
    }

    if (!logoFound) {
      console.warn("Logo not found in any expected locations. Paths tried:", possibleLogoPaths);
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

    // Customer Information - Improved fallback handling
    doc
      .text(`Name: ${user.name || booking.guestName || "Guest"}`, 300, 100)
      .text(`Email: ${email}`, 300, 115)
      .text(`Phone: ${phone}`, 300, 130);

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

    // Format dates more safely with multiple fallback options
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (e) {
        console.error("Date formatting error:", e);
        return "Invalid Date";
      }
    };

    doc
      .text(property.title || "Unknown Property", 50, bookingTableTop + 20)
      .text(formatDate(booking.checkInDate), 200, bookingTableTop + 20)
      .text(formatDate(booking.checkOutDate), 300, bookingTableTop + 20)
      .text(
        `${invoice.amounts.total} ${invoice.amounts.currency}`,
        400,
        bookingTableTop + 20
      );

    // Guest Details - Prioritize guestDetails from invoice, then fall back to booking
    // Improve extraction with more reliable fallbacks
    const rooms = invoice.guestDetails?.rooms || booking.rooms || "N/A";
    const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
    const adults = invoice.guestDetails?.adults || booking.adults || "N/A";
    const children = invoice.guestDetails?.children || booking.children || 0;
    const paymentMethod =
      invoice.paymentMethod || booking.paymentMethod || "N/A";

    doc
      .text(`Rooms: ${rooms}`, 50, 250)
      .text(`Nights: ${nights || "N/A"}`, 150, 250)
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

// Improved helper function to calculate number of nights between two dates
function calculateNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return null;

  try {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(end - start);

    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (e) {
    console.error("Error calculating nights:", e);
    return null;
  }
}

module.exports = { generateInvoicePDF };