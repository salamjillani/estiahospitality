// backend/models/Booking.js
const mongoose = require('mongoose');
const shortid = require('shortid');

const bookingSchema = new mongoose.Schema({
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  rooms: { type: Number, required: true },
  adults: { type: Number, required: true },
  children: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'canceled'], 
    default: 'pending' 
  },
  specialRequests: String,
  arrivalTime: String,
  nationality: String,
  guestName: String,
  email: String,
  phone: String,
  reservationCode: {
    type: String,
    required: true,
    unique: true,
    default: () => shortid.generate()
  }
}, { timestamps: true });


module.exports = mongoose.model('Booking', bookingSchema);