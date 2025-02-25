const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Apartment', 'House', 'Villa', 'Cabin'],
    required: true
  },
  description: String,
  bedrooms: {
    type: Number,
    required: true,
    min: 1
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    address: String,
    city: String,
    country: String,
    postalCode: String
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    bankName: String,
    swiftCode: String,
    iban: String,
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
      default: 'USD'
    }
  },
  amenities: {
    swimmingPool: Boolean,
    parking: Boolean,
    wifi: Boolean,
    airConditioning: Boolean,
    kitchen: Boolean
  },
  guestCapacity: Number,
  rules: [String],
  rates: {
    nightly: Number,
    weekly: Number,
    monthly: Number
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  photos: [{
    url: String,
    publicId: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);