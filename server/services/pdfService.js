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

    // Create PDF document with responsive settings
    // Using A4 size which is standard and works well across devices
    doc = new PDFDocument({ 
      size: "A4", 
      margin: 35,
      bufferPages: true,
      autoFirstPage: true,
      layout: "portrait" // Portrait mode works better for responsive viewing
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
    // High contrast colors improve readability across all devices
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
    // Use percentages for positioning where possible for better adaptability
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = Math.min(35, pageWidth * 0.05); // Responsive margin (5% of width, max 35pt)
    const contentWidth = pageWidth - (margin * 2);

    // Responsive scaling factor - adjusts based on page width
    // This makes content proportionally distributed regardless of device
    const scalingFactor = Math.max(1.1, Math.min(1.2, pageWidth / 500)); 

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

    // =============== HEADER SECTION - RESPONSIVELY DESIGNED ===============
    // Sleek top bar - full width for consistency across devices
    doc.rect(0, 0, pageWidth, 8).fill(colors.primary);
    
    // Try each potential logo path
    let logoFound = false;
    const logoHeight = pageHeight * 0.05; // Responsive logo height
    const logoWidth = logoHeight * 1.4;  // Maintain aspect ratio

    for (const logoPath of possibleLogoPaths) {
      try {
        if (fs.existsSync(logoPath)) {
          console.log(`Logo found at: ${logoPath}`);
          doc.image(logoPath, margin, 25, { width: logoWidth });
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
        .fontSize(Math.max(16, pageWidth * 0.05)) // Responsive font size
        .font('Helvetica-Bold')
        .text("ESTIA HOSPITALITY", margin, 25);
    }

    // Company information positioned BELOW the logo, not overlapping
    // Responsive spacing based on page dimensions
    const addressY = logoFound ? margin + logoHeight + 15 : 55;
    const addressFontSize = Math.max(7, pageWidth * 0.02); // Responsive font size

    doc.fillColor(colors.lightText)
      .fontSize(addressFontSize)
      .font('Helvetica')
      .text("Geronimaki Str.41A", margin, addressY)
      .text("Heraklion Crete Greece, PO: 71307", margin, addressY + addressFontSize + 2)
      .text("VAT: EL 802248273", margin, addressY + (addressFontSize + 2) * 2);

    // Customer Information - Right aligned with responsive positioning
    const infoFontSize = Math.max(8, pageWidth * 0.022); // Responsive font size
    const customerInfoX = pageWidth - margin - pageWidth * 0.25; // 25% of page width from right
    
    doc.fillColor(colors.primary)
      .fontSize(infoFontSize + 1) // Slightly larger for title
      .font('Helvetica-Bold')
      .text("BILLED", customerInfoX, 25);
      
    doc.fillColor(colors.text)
      .fontSize(infoFontSize)
      .font('Helvetica')
      .text(`${user.name || booking.guestName || "Guest"}`, customerInfoX, 25 + (infoFontSize + 4))
      .text(`${email}`, customerInfoX, 25 + (infoFontSize + 4) * 2)
      .text(`${phone}`, customerInfoX, 25 + (infoFontSize + 4) * 3);

    // Invoice title with responsive positioning
    const titleFontSize = Math.max(16, pageWidth * 0.045); // Responsive title font size
    const invoiceTitleY = addressY + addressFontSize * 4 + 10; // Dynamic positioning

    // Large invoice heading
    doc.fillColor(colors.primary)
      .fontSize(titleFontSize)
      .font('Helvetica-Bold')
      .text("ESTIA HOSPITALITY", margin, invoiceTitleY);
    
    // Format status
    const formattedStatus = invoice.status ? 
      invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase() : 
      "Pending";
    
    // Status pill with responsive sizing
    const statusFontSize = Math.max(8, pageWidth * 0.022);
    const statusPadding = 8;
    const statusWidth = doc.widthOfString(formattedStatus) + statusPadding * 2;
    const statusHeight = statusFontSize + statusPadding;
    
    doc.roundedRect(
      pageWidth - margin - statusWidth, 
      invoiceTitleY, 
      statusWidth, 
      statusHeight, 
      Math.min(10, statusHeight / 2) // Responsive corner radius
    ).fill(invoice.status?.toLowerCase() === "paid" ? colors.success : colors.accent);
    
    doc.fillColor("white")
      .fontSize(statusFontSize)
      .font('Helvetica-Bold')
      .text(
        formattedStatus, 
        pageWidth - margin - statusWidth + statusPadding, 
        invoiceTitleY + (statusHeight - statusFontSize) / 2
      );

    // =============== INVOICE DETAILS - RESPONSIVE GRID ===============
    // Dynamic spacing based on content
    const detailsY = invoiceTitleY + titleFontSize + 10;
    
    // Draw thin separator line
    doc.moveTo(margin, detailsY).lineTo(margin + contentWidth, detailsY)
      .lineWidth(0.5)
      .stroke(colors.border);
    
    // Responsive column layout - adapt number of columns based on page width
    const detailLabelSize = Math.max(7, pageWidth * 0.02);
    const detailValueSize = Math.max(8, pageWidth * 0.022);
    const detailPadding = 10 * scalingFactor;
    
    // For narrow screens (like mobile), stack in 2 columns instead of 4
    const numCols = pageWidth < 400 ? 2 : 4;
    const colWidth = contentWidth / numCols;
    
    const details = [
      { 
        label: "INVOICE NUMBER", 
        value: invoice.invoiceNumber 
      },
      { 
        label: "RESERVATION CODE", 
        value: booking.reservationCode || "N/A" 
      },
      { 
        label: "DATE ISSUED", 
        value: new Date(invoice.issuedDate).toLocaleDateString() 
      },
      { 
        label: "PAYMENT METHOD", 
        value: invoice.paymentMethod || booking.paymentMethod || "N/A" 
      }
    ];

    // Render details responsively
    details.forEach((detail, i) => {
      const col = i % numCols;
      const row = Math.floor(i / numCols);
      const x = margin + col * colWidth;
      const y = detailsY + detailPadding + row * (detailLabelSize + detailValueSize + detailPadding);
      
      doc.fillColor(colors.lightText)
        .fontSize(detailLabelSize)
        .font('Helvetica-Bold')
        .text(detail.label, x, y);
        
      doc.fillColor(colors.text)
        .fontSize(detailValueSize)
        .font('Helvetica')
        .text(detail.value, x, y + detailLabelSize + 5);
    });

    // Calculate new position after details section
    const lastRow = Math.ceil(details.length / numCols) - 1;
    const detailsEndY = detailsY + detailPadding + 
                        (lastRow + 1) * (detailLabelSize + detailValueSize + detailPadding);
    
    // Bottom separator line - adjusted dynamically
    doc.moveTo(margin, detailsEndY).lineTo(margin + contentWidth, detailsEndY)
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

    // =============== RESERVATION DETAILS - RESPONSIVE CARDS ===============
    // Dynamic spacing based on page flow
    const sectionTitleSize = Math.max(9, pageWidth * 0.025);
    const reservationY = detailsEndY + 15;
    
    doc.fillColor(colors.primary)
      .fontSize(sectionTitleSize)
      .font('Helvetica-Bold')
      .text("RESERVATION DETAILS", margin, reservationY);

    // Card dimensions that adapt to screen size
    const cardLabelSize = Math.max(7, pageWidth * 0.018);
    const cardValueSize = Math.max(8, pageWidth * 0.022);
    const cardPadding = 8 * scalingFactor;
    
    // For narrow screens, use 2 columns instead of 4
    const cardCols = pageWidth < 400 ? 2 : 4;
    const cardSpacing = 6 * scalingFactor;
    const cardWidth = (contentWidth - cardSpacing * (cardCols - 1)) / cardCols;
    
    // Dynamic card height based on content
    const cardY = reservationY + sectionTitleSize + 10;
    const cardHeight = 70 * scalingFactor; // Base height, adjusts with scaling
    
    // UPDATED: Modified cards for responsive display
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
    
    // Draw responsive cards
    cards.forEach((card, i) => {
      const col = i % cardCols;
      const row = Math.floor(i / cardCols);
      const x = margin + (cardWidth + cardSpacing) * col;
      const y = cardY + (cardHeight + cardSpacing) * row;
      
      // Card background with subtle shadow effect
      doc.rect(x, y, cardWidth, cardHeight)
        .fill(colors.secondary);
      
      // Accent strip
      doc.rect(x, y, 3, cardHeight)
        .fill(colors.primary);
      
      // Card title - adjusted spacing
      doc.fillColor(colors.primary)
        .fontSize(cardLabelSize)
        .font('Helvetica-Bold')
        .text(card.title, x + cardPadding, y + cardPadding);
      
      // Card value - adjusted spacing
      doc.fillColor(colors.text)
        .fontSize(cardValueSize)
        .font('Helvetica')
        .text(card.value, x + cardPadding, y + cardPadding + cardLabelSize + 5, {
          width: cardWidth - (cardPadding * 2),
          height: cardHeight - (cardPadding * 2) - cardLabelSize - 5
        });
    });

    // Calculate new position after cards section
    const lastCardRow = Math.ceil(cards.length / cardCols) - 1;
    const cardsEndY = cardY + (lastCardRow + 1) * (cardHeight + cardSpacing);

    // =============== PAYMENT DETAILS - RESPONSIVE TABLE ===============
    // Dynamic spacing based on page flow
    const paymentY = cardsEndY + 20;
    
    doc.fillColor(colors.primary)
      .fontSize(sectionTitleSize)
      .font('Helvetica-Bold')
      .text("PAYMENT DETAILS", margin, paymentY);
    
    // Table spacing with responsive dimensions
    const tableY = paymentY + sectionTitleSize + 10;
    const tableHeaderSize = Math.max(7, pageWidth * 0.02);
    const tableValueSize = Math.max(8, pageWidth * 0.022);
    const tableRowHeight = Math.max(25, pageHeight * 0.03);
    
    // Responsive column widths that adapt to screen size
    const descColWidth = contentWidth * 0.4;
    const nightsColWidth = contentWidth * 0.15;
    const priceColWidth = contentWidth * 0.2;
    const amountColWidth = contentWidth * 0.25;
    
    // Subtle table header
    doc.rect(margin, tableY, contentWidth, tableRowHeight)
      .fill(colors.secondary);
    
    // Table headers with responsive positioning
    doc.fillColor(colors.primary)
      .fontSize(tableHeaderSize)
      .font('Helvetica-Bold')
      .text("DESCRIPTION", margin + 10, tableY + (tableRowHeight - tableHeaderSize) / 2)
      .text("NIGHTS", margin + descColWidth, tableY + (tableRowHeight - tableHeaderSize) / 2, 
            { width: nightsColWidth, align: 'right' })
      .text("UNIT PRICE", margin + descColWidth + nightsColWidth, tableY + (tableRowHeight - tableHeaderSize) / 2, 
            { width: priceColWidth, align: 'right' })
      .text("AMOUNT", margin + descColWidth + nightsColWidth + priceColWidth, tableY + (tableRowHeight - tableHeaderSize) / 2, 
            { width: amountColWidth, align: 'right' });
    
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
    
    // Table content rows with responsive positioning
    let rowY = tableY + tableRowHeight + 10;
    
    // Net price row
    doc.fillColor(colors.text)
      .fontSize(tableValueSize)
      .font('Helvetica')
      .text(`Stay at ${property.title} (Net)`, margin + 10, rowY)
      .text(nights || "N/A", margin + descColWidth, rowY, 
            { width: nightsColWidth, align: 'right' })
      .text(`${formatCurrency(nightlyNetPrice)} ${currency}`, margin + descColWidth + nightsColWidth, rowY, 
            { width: priceColWidth, align: 'right' })
      .text(`${formatCurrency(netAmount)} ${currency}`, margin + descColWidth + nightsColWidth + priceColWidth, rowY, 
            { width: amountColWidth, align: 'right' });
    
    // Tax row
    rowY += tableRowHeight;
    doc.fillColor(colors.text)
      .fontSize(tableValueSize)
      .font('Helvetica')
      .text(`VAT/Tax (${vatRate}%)`, margin + 10, rowY)
      .text(nights || "N/A", margin + descColWidth, rowY, 
            { width: nightsColWidth, align: 'right' })
      .text(`${formatCurrency(nightlyTaxAmount)} ${currency}`, margin + descColWidth + nightsColWidth, rowY, 
            { width: priceColWidth, align: 'right' })
      .text(`${formatCurrency(taxAmount)} ${currency}`, margin + descColWidth + nightsColWidth + priceColWidth, rowY, 
            { width: amountColWidth, align: 'right' });
    
    // Subtle line separator
    rowY += tableRowHeight;
    doc.moveTo(margin, rowY).lineTo(margin + contentWidth, rowY)
      .lineWidth(0.5)
      .stroke(colors.border);
    
    // Total section with responsive positioning
    const totalY = rowY + 15;
    const totalHeight = Math.max(35, pageHeight * 0.04);
    
    doc.rect(margin + contentWidth * 0.4, totalY, contentWidth * 0.6, totalHeight)
      .fill(colors.primary);
    
    doc.fillColor("white")
      .fontSize(tableValueSize * 1.2) // Slightly larger for emphasis
      .font('Helvetica-Bold')
      .text("TOTAL COST", margin + contentWidth * 0.4 + 15, totalY + (totalHeight - tableValueSize * 1.2) / 2)
      .text(`${formatCurrency(totalAmount)} ${currency}`, 
            margin + contentWidth * 0.4 + contentWidth * 0.35, 
            totalY + (totalHeight - tableValueSize * 1.2) / 2, 
            { width: contentWidth * 0.25, align: 'right' });
    
    // =============== FOOTER - ADAPTIVELY POSITIONED ===============
    // Calculate appropriate footer position based on content
    // This ensures it stays at the bottom regardless of content length
    const minFooterDistance = 50; // Minimum space between content and footer
    const footerHeight = pageHeight * 0.06; // Responsive footer height
    
    // Determine if we need to add a new page for the footer
    const footerY = Math.max(
      totalY + totalHeight + minFooterDistance,
      pageHeight - footerHeight - margin
    );
    
    // Check if we need a new page for the footer
    if (footerY + footerHeight > pageHeight) {
      doc.addPage();
      // Reset footerY to top of new page
      footerY = margin;
    }
    
    // Attractive footer background
    doc.rect(0, footerY, pageWidth, footerHeight).fill(colors.secondary);
    
    // Bottom accent bar
    doc.rect(0, footerY + footerHeight - 8, pageWidth, 8).fill(colors.primary);
    
    // Footer text - centered nicely with responsive font sizes
    const footerTitleSize = Math.max(8, pageWidth * 0.022);
    const footerTextSize = Math.max(7, pageWidth * 0.018);
    
    doc.fillColor(colors.primary)
      .fontSize(footerTitleSize)
      .font('Helvetica-Bold')
      .text("Thank you for choosing ESTIA HOSPITALITY!", 0, footerY + (footerHeight - 8 - footerTitleSize - footerTextSize - 5) / 2, {
        align: "center",
      });
    
    doc.fillColor(colors.lightText)
      .fontSize(footerTextSize)
      .font('Helvetica')
      .text("For any questions regarding this invoice, please contact us", 0, footerY + (footerHeight - 8 - footerTitleSize - footerTextSize - 5) / 2 + footerTitleSize + 5, {
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