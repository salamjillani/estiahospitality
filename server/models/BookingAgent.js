// server/models/BookingAgent.js
const mongoose = require('mongoose');

const bookingAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
});

bookingAgentSchema.pre('save', async function(next) {
  const agent = this;
  
  // Check for duplicate name
  const existingAgent = await mongoose.model('BookingAgent').findOne({ 
    name: agent.name,
    _id: { $ne: agent._id }
  });
  
  if (existingAgent) {
    return next(new Error('Agent name already exists'));
  }
  
  next();
});

module.exports = mongoose.model('BookingAgent', bookingAgentSchema);