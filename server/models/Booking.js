//server/models/Booking.js
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
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      default: () => Math.random().toString(36).substr(2, 6).toUpperCase()
    },
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


bookingSchema.pre('validate', function(next) {

  if (typeof this.startDate === 'string') {
    this.startDate = new Date(this.startDate);
  }
  if (typeof this.endDate === 'string') {
    this.endDate = new Date(this.endDate);
  }
  
 
  if (this.pricePerNight) {
    this.pricePerNight = Number(this.pricePerNight);
  }
  
  next();
});

bookingSchema.pre('save', function(next) {
  try {
  
    if (typeof this.pricePerNight !== 'number' || isNaN(this.pricePerNight) || this.pricePerNight <= 0) {
      throw new Error('Valid price per night is required');
    }

  
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    this.totalNights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));


    this.totalPrice = Number(this.pricePerNight) * Number(this.totalNights);

    this.commissionAmount = Number(
      (this.totalPrice * (this.commissionPercentage / 100)).toFixed(2)
    );
    this.netAmount = Number(
      (this.totalPrice - this.commissionAmount).toFixed(2)
    );

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