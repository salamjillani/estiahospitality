// server/models/Booking.js
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
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: function() {
        // Set default commission based on source
        switch(this.source) {
          case 'booking.com':
            return 15;
          case 'airbnb':
            return 12;
          case 'vrbo':
            return 8;
          default:
            return 0; // No commission for direct bookings
        }
      }
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
      default: function() {
        return this.totalPrice * (1 - this.commissionPercentage / 100);
      }
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
      default: function() {
        return this.totalPrice * (this.commissionPercentage / 100);
      }
    },
    notes: String,
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

// Pre-save middleware to calculate netAmount and commissionAmount
bookingSchema.pre('save', function(next) {
  if (this.isModified('totalPrice') || this.isModified('commissionPercentage')) {
    this.netAmount = this.totalPrice * (1 - this.commissionPercentage / 100);
    this.commissionAmount = this.totalPrice * (this.commissionPercentage / 100);
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;