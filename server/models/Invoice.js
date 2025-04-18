// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: [true, 'Invoice number is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: () => new Date(Date.now() + 30*24*60*60*1000) // 30 days from now
  },
  amounts: {
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'stripe'],
    required: true
  },
  guestDetails: {
    name: String,
    email: String,
    phone: String,
    nationality: String,
    rooms: Number,
    adults: Number,
    children: Number
  },
  propertyDetails: {
    title: String,
    address: String,
    city: String,
    country: String
  }
}, { 
  timestamps: true 
});
invoiceSchema.index({ createdAt: 1 });


// models/Invoice.js
invoiceSchema.pre('save', async function(next) {
  if (!this.isNew || this.invoiceNumber) return next();

  try {
    const counter = await mongoose.model('Counter').findByIdAndUpdate(
      { _id: 'invoiceNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);