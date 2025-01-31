// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['airbnb', 'booking']
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  issuedDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  reservation: {
    checkIn: Date,
    checkOut: Date,
    guestName: String,
    platformReservationId: String
  },
  amounts: {
    subtotal: Number,
    tax: Number,
    total: Number,
    currency: String
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'draft'
  },
  taxDetails: {
    vatNumber: String,
    taxId: String,
    taxRate: Number
  },
  vendorDetails: {
    name: String,
    address: String,
    taxIdentifier: String
  },
  notes: String
}, {
  timestamps: true
});

// Generate unique invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);