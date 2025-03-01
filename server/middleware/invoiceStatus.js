// middleware/invoiceStatus.js
const Invoice = require('../models/Invoice');

const syncInvoiceStatus = async (req, res, next) => {
  try {
    const booking = req.updatedBooking;
    await Invoice.findOneAndUpdate(
      { booking: booking._id },
      { status: booking.status }
    );
    next();
  } catch (err) {
    console.error('Error updating invoice status:', err);
    next(err);
  }
};

module.exports = syncInvoiceStatus;