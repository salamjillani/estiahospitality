const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Short Term Rental",
        "Short Term Rental >80 sq.m",
        "Self Sustained Villa",
        "Self Sustained Residency <=80sq.m",
        "Self Sustained Residency >80sq.m",
      ],
      required: true,
    },
    description: String,
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
    },
    guestCapacity: {
      type: Number,
      required: true,
      min: 1
    },
    location: {
      address: String,
      city: String,
      country: String,
      postalCode: String,
    },
  
pricePerNight: {
  type: Number,
  required: true,
  min: 0,
  default: function() {
    return this.rates?.nightly || 0; // Fallback to rates.nightly
  }
},
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      bankName: String,
      swiftCode: String,
      iban: String,
      currency: {
        type: String,
        required: [true, "Currency is required"],
        enum: ["USD", "EUR", "GBP", "INR", "JPY"],
        default: "USD",
      },
    },
    amenities: {
      swimmingPool: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
      kitchen: { type: Boolean, default: false },
      tv: { type: Boolean, default: false },
      washer: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
    },
    guestCapacity: Number,
    rules: [String],
    rates: {
      nightly: Number,
      weekly: Number,
      monthly: Number,
    },

    photos: [
      {
        url: String,
        publicId: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
