const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    source: {
      type: String,
      enum: ["direct", "airbnb", "booking.com", "vrbo"],
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
    // Remove default functions from schema definition
    totalNights: Number,
    totalPrice: Number,
    commissionPercentage: Number,
    netAmount: Number,
    commissionAmount: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate middleware to ensure proper data types
bookingSchema.pre('validate', function(next) {
  // Convert string dates to Date objects if needed
  if (typeof this.startDate === 'string') {
    this.startDate = new Date(this.startDate);
  }
  if (typeof this.endDate === 'string') {
    this.endDate = new Date(this.endDate);
  }
  
  // Ensure pricePerNight is a number
  if (this.pricePerNight) {
    this.pricePerNight = Number(this.pricePerNight);
  }
  
  next();
});

/// Update the pre-save middleware in the Booking model
bookingSchema.pre('save', function(next) {
  try {
    // Ensure pricePerNight is a valid number
    if (typeof this.pricePerNight !== 'number' || isNaN(this.pricePerNight) || this.pricePerNight <= 0) {
      throw new Error('Valid price per night is required');
    }

    // Calculate total nights
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    this.totalNights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    // Calculate total price (ensure both values are numbers)
    this.totalPrice = Number(this.pricePerNight) * Number(this.totalNights);

    // Set commission percentage based on source
    this.commissionPercentage = {
      'booking.com': 15,
      'airbnb': 12,
      'vrbo': 8,
      'direct': 0
    }[this.source] || 0;

    // Calculate commission amounts with proper number handling
    this.commissionAmount = Number((this.totalPrice * (this.commissionPercentage / 100)).toFixed(2));
    this.netAmount = Number((this.totalPrice - this.commissionAmount).toFixed(2));

    // Final validation
    if (isNaN(this.totalPrice) || this.totalPrice <= 0) {
      throw new Error('Invalid total price calculation');
    }

    next();
  } catch (error) {
    next(error);
  }
});
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;