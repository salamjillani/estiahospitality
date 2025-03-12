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

    // Create PDF document with optimized margins
    doc = new PDFDocument({ 
      size: "A4", 
      margin: 35,
      bufferPages: true
    });

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

    // Define elegant color scheme with high contrast for readability
    const colors = {
      primary: "#1E40AF",       // Deep rich blue
      secondary: "#F0F5FF",     // Very light blue tint
      accent: "#F97316",        // Bright orange
      text: "#111827",          // Near black for readability
      lightText: "#6B7280",     // Medium gray
      border: "#E5E7EB",        // Light border
      success: "#059669",       // Emerald green for paid status
      highlight: "#FAFAFA"      // Very subtle highlight
    };
    
    // Define page dimensions for precise positioning
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 35;
    const contentWidth = pageWidth - (margin * 2);

    // Calculate appropriate scaling factor to distribute content
    // This will help us evenly space the content to fill the page
    const scalingFactor = 1.15; // Adjust this to expand spacing as needed

    // UPDATED: Improved logo path resolution with more paths for your specific structure
    const possibleLogoPaths = [
      path.join(__dirname, "../frontend/public/logo.png"),
      path.join(__dirname, "../../frontend/public/logo.png"),
      path.join(
        path.dirname(require.main.filename),
        "../frontend/public/logo.png"
      ),
      path.join(process.cwd(), "frontend/public/logo.png"),
      path.join(__dirname, "../../public/logo.png"),
      path.join(__dirname, "../public/logo.png"),
      path.join(__dirname, "../frontend/build/logo.png"),
      path.join(process.cwd(), "public/logo.png"),
    ];

    // =============== HEADER SECTION - MODERNIZED ===============
    // Sleek top bar
    doc.rect(0, 0, pageWidth, 8).fill(colors.primary);
    
    // Try each potential logo path
    let logoFound = false;
    for (const logoPath of possibleLogoPaths) {
      try {
        if (fs.existsSync(logoPath)) {
          console.log(`Logo found at: ${logoPath}`);
          doc.image(logoPath, margin, 25, { width: 70 });
          logoFound = true;
          break;
        }
      } catch (err) {
        console.warn(`Error checking logo path ${logoPath}:`, err.message);
      }
    }

    if (!logoFound) {
      console.warn(
        "Logo not found in any expected locations. Paths tried:",
        possibleLogoPaths
      );
      doc.fillColor(colors.primary)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text("ESTIA HOSPITALITY", margin, 25);
    }

    // Company information positioned BELOW the logo, not overlapping
    // Increased spacing with scaling factor
    const addressY = logoFound ? 100 : 55; // Adjusted with more space
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica')
      .text("Geronimaki Str.41A", margin, addressY)
      .text("Heraklion Crete Greece, PO: 71307", margin, addressY + 10)
      .text("VAT: EL 802248273", margin, addressY + 20);

    // Customer Information - Right aligned for visual balance
    const customerInfoX = pageWidth - margin - 150;
    doc.fillColor(colors.primary)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text("BILLED", customerInfoX, 25);
      
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(`${user.name || booking.guestName || "Guest"}`, customerInfoX, 40)
      .text(`${email}`, customerInfoX, 55)
      .text(`${phone}`, customerInfoX, 70);

    // Invoice title position - adjusted with scaling factor
    const invoiceTitleY = addressY + (40 * scalingFactor);

    // Large invoice heading
    doc.fillColor(colors.primary)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text("ESTIA HOSPITALITY", margin, invoiceTitleY);
    
    // Format status
    const formattedStatus = invoice.status ? 
      invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase() : 
      "Pending";
    
    // Status pill
    const statusWidth = doc.widthOfString(formattedStatus) + 16;
    doc.roundedRect(pageWidth - margin - statusWidth, invoiceTitleY, statusWidth, 20, 10)
      .fill(invoice.status?.toLowerCase() === "paid" ? colors.success : colors.accent);
    
    doc.fillColor("white")
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(formattedStatus, pageWidth - margin - statusWidth + 8, invoiceTitleY + 6);

    // =============== INVOICE DETAILS - MINIMALIST APPROACH ===============
    // Spacing adjusted with scaling factor
    const detailsY = invoiceTitleY + (30 * scalingFactor);
    
    // Draw thin separator line
    doc.moveTo(margin, detailsY).lineTo(margin + contentWidth, detailsY)
      .lineWidth(0.5)
      .stroke(colors.border);
    
    // Column layout for details - Changed from 3 to 4 columns to include reservation code
    const colWidth = contentWidth / 4;
    
    // Invoice number
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text("INVOICE NUMBER", margin, detailsY + 10);
      
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(invoice.invoiceNumber, margin, detailsY + 25);
    
    // Reservation code - New addition
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text("RESERVATION CODE", margin + colWidth, detailsY + 10);
      
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(booking.reservationCode || "N/A", margin + colWidth, detailsY + 25);
    
    // Issue date - Now in 3rd column
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text("DATE ISSUED", margin + colWidth * 2, detailsY + 10);
      
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(new Date(invoice.issuedDate).toLocaleDateString(), margin + colWidth * 2, detailsY + 25);
    
    // Payment method - Now in 4th column
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text("PAYMENT METHOD", margin + colWidth * 3, detailsY + 10);
      
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(invoice.paymentMethod || booking.paymentMethod || "N/A", margin + colWidth * 3, detailsY + 25);

    // Bottom separator line - adjusted with scaling factor
    doc.moveTo(margin, detailsY + (45 * scalingFactor)).lineTo(margin + contentWidth, detailsY + (45 * scalingFactor))
      .lineWidth(0.5)
      .stroke(colors.border);

    // Format dates safely with fallbacks
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (e) {
        console.error("Date formatting error:", e);
        return "Invalid Date";
      }
    };

    // Calculate reservation details
    const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
    const rooms = invoice.guestDetails?.rooms || booking.rooms || "N/A";
    const adults = invoice.guestDetails?.adults || booking.adults || "N/A";
    const children = invoice.guestDetails?.children || booking.children || 0;

    // =============== RESERVATION DETAILS - COMPACT CARDS ===============
    // Spacing adjusted with scaling factor
    const reservationY = detailsY + (55 * scalingFactor);
    doc.fillColor(colors.primary)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text("RESERVATION DETAILS", margin, reservationY);

    // Card dimensions adjusted with scaling factor
    const cardY = reservationY + (20 * scalingFactor);
    const cardHeight = 70; // Increased height
    const cardSpacing = 6;
    const cardWidth = (contentWidth - cardSpacing * 3) / 4;
    
    // UPDATED: Modified Property card to separate property title from location
    const cards = [
      { 
        title: "PROPERTY", 
        value: property.title || "Unknown Property" 
      },
      { 
        title: "LOCATION", 
        value: `${property.location?.address || "N/A"}\n${property.location?.city || ""}, ${property.location?.country || ""}` 
      },
      { 
        title: "CHECK-IN & CHECK-OUT", 
        value: `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}` 
      },
      { 
        title: "GUESTS AND ROOMS", 
        value: `${adults} Adults, ${children} Children\n${rooms} Rooms` 
      }
    ];
    
    // Draw modern cards with increased internal spacing
    cards.forEach((card, i) => {
      const x = margin + (cardWidth + cardSpacing) * i;
      
      // Card background with subtle shadow effect
      doc.rect(x, cardY, cardWidth, cardHeight)
        .fill(colors.secondary);
      
      // Accent strip
      doc.rect(x, cardY, 3, cardHeight)
        .fill(colors.primary);
      
      // Card title - adjusted spacing
      doc.fillColor(colors.primary)
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(card.title, x + 8, cardY + 15);
      
      // Card value - adjusted spacing
      doc.fillColor(colors.text)
        .fontSize(9)
        .font('Helvetica')
        .text(card.value, x + 8, cardY + 30, {
          width: cardWidth - 16,
          height: cardHeight - 35
        });
    });

    // =============== PAYMENT DETAILS - MINIMALIST TABLE WITH TAX BREAKDOWN ===============
    // Spacing adjusted with scaling factor
    const paymentY = cardY + cardHeight + (25 * scalingFactor);
    doc.fillColor(colors.primary)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text("PAYMENT DETAILS", margin, paymentY);
    
    // Table spacing adjusted with scaling factor
    const tableY = paymentY + (20 * scalingFactor);
    
    // Subtle table header
    doc.rect(margin, tableY, contentWidth, 25) // Increased height
      .fill(colors.secondary);
    
    // Table headers - adjusted spacing
    doc.fillColor(colors.primary)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text("DESCRIPTION", margin + 10, tableY + 9)
      .text("NIGHTS", margin + 230, tableY + 9, { width: 50, align: 'right' })
      .text("UNIT PRICE", margin + 290, tableY + 9, { width: 80, align: 'right' })
      .text("AMOUNT", margin + contentWidth - 60, tableY + 9, { width: 50, align: 'right' });
    
    // Calculate tax components based on the total amount
    const totalAmount = parseFloat(invoice.amounts.total) || 0;
    const vatRate = 13; // 13% VAT rate as specified
    
    // Calculate the net and tax amounts
    const netAmount = (totalAmount * 100) / (100 + vatRate);
    const taxAmount = totalAmount - netAmount;
    
    // Calculate per night prices
    const nightlyNetPrice = nights ? (netAmount / nights).toFixed(2) : "N/A";
    const nightlyTaxAmount = nights ? (taxAmount / nights).toFixed(2) : "N/A";
    
    // Format currency amounts
    const formatCurrency = (amount, decimals = 2) => {
      return typeof amount === 'number' 
        ? amount.toFixed(decimals) 
        : amount;
    };
    
    const currency = invoice.amounts.currency || "EUR";
    
    // Table content rows - adjusted spacing with tax breakdown
    let rowY = tableY + 35;
    
    // Net price row
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(`Stay at ${property.title} (Net)`, margin + 10, rowY)
      .text(nights || "N/A", margin + 230, rowY, { width: 50, align: 'right' })
      .text(`${formatCurrency(nightlyNetPrice)} ${currency}`, margin + 290, rowY, { width: 80, align: 'right' })
      .text(`${formatCurrency(netAmount)} ${currency}`, margin + contentWidth - 60, rowY, { width: 50, align: 'right' });
    
    // Tax row
    rowY += 25;
    doc.fillColor(colors.text)
      .fontSize(9)
      .font('Helvetica')
      .text(`VAT/Tax (${vatRate}%)`, margin + 10, rowY)
      .text(nights || "N/A", margin + 230, rowY, { width: 50, align: 'right' })
      .text(`${formatCurrency(nightlyTaxAmount)} ${currency}`, margin + 290, rowY, { width: 80, align: 'right' })
      .text(`${formatCurrency(taxAmount)} ${currency}`, margin + contentWidth - 60, rowY, { width: 50, align: 'right' });
    
    // Subtle line separator - adjusted spacing
    rowY += 25;
    doc.moveTo(margin, rowY).lineTo(margin + contentWidth, rowY)
      .lineWidth(0.5)
      .stroke(colors.border);
    
    // Total section - adjusted spacing
    const totalY = rowY + (20 * scalingFactor);
    doc.rect(margin + 220, totalY, contentWidth - 220, 35) // Increased height
      .fill(colors.primary);
    
    doc.fillColor("white")
      .fontSize(10)
      .font('Helvetica-Bold')
      .text("TOTAL COST", margin + 235, totalY + 13)
      .text(`${formatCurrency(totalAmount)} ${currency}`, margin + contentWidth - 60, totalY + 13, { width: 50, align: 'right' });
    
    // =============== FOOTER - PROPERLY POSITIONED ===============
    // Calculate better footer positioning to eliminate excess white space
    // Position footer based on a percentage of the page height instead of absolute positioning
    const footerPosition = 0.94; // Position at 94% of page height
    const footerY = pageHeight * footerPosition - 50; // 50px from the position for the footer height
    
    // Attractive footer background
    doc.rect(0, footerY, pageWidth, 50).fill(colors.secondary);
    
    // Bottom accent bar
    doc.rect(0, footerY + 42, pageWidth, 8).fill(colors.primary);
    
    // Footer text - centered nicely
    doc.fillColor(colors.primary)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text("Thank you for choosing ESTIA HOSPITALITY!", 0, footerY + 12, {
        align: "center",
      });
    
    doc.fillColor(colors.lightText)
      .fontSize(8)
      .font('Helvetica')
      .text("For any questions regarding this invoice, please contact us", 0, footerY + 25, {
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