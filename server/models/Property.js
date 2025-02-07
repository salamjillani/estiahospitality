// models/Property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  identifier: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    required: true,
    enum: ['villa', 'holiday_apartment', 'hotel', 'cottage'],
    default: 'villa',
  },
  vendorType: {
    type: String,
    required: true,
    enum: ['individual', 'company']
  },
  vendorDetails: {
    name: String,
    companyName: String,
    registrationNumber: String,
    contactPerson: String,
    email: String,
    phone: String
  },
  profile: {
    description: String,
    location: { 
      address: String,
      city: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    photos: [{
      url: String,
      caption: String,
      isPrimary: Boolean
    }]
    
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    bankName: String,
    swiftCode: String,
    iban: String,
    currency: String
  },
  platformSettings: {
    airbnb: {
      enabled: Boolean,
      listingUrl: String,
      propertyId: String,
      taxDetails: {
        vatNumber: String,
        taxId: String,
        taxRate: Number,
        registrationNumber: String
      }
    },
    booking: {
      enabled: Boolean,
      listingUrl: String,
      propertyId: String,
      taxDetails: {
        vatNumber: String,
        taxId: String,
        taxRate: Number,
        registrationNumber: String
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);